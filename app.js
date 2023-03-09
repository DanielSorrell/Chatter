const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*"}});

const {Users} = require("./assets/js/users.js");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Room = require("./models/room");
const Message = require("./models/message");
let users = new Users();
let liveRoomsMap = new Map();

app.set("view engine", "ejs");
app.use(express.static("assets"));
app.use(express.urlencoded({extended: false}));
app.use('/favicon.ico', express.static('images/favicon.ico'));
dotenv.config();

let bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({ extended: false });
let roomsArray = [];
let roomNameInUseError;

/** Connect to mongodb database. */
const dbURI = "mongodb+srv://" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => console.log("Database connection successful."))
  .catch((error) => console.log(error));

/** Handle routing for the home page. */
app.get("/", (req, res) => {
  res.render("homePage");
});

/** Handle routing for the create room page */
app.get("/createRoom", (req, res) => {
  res.render("createRoom");
});

/** Handle routing for posting and loading a room after creation */
app.post("/createRoom", urlencodedParser, (req, res) => {
  let roomID = req.body.roomID;
  //block attempts of creating a room with the same room ID already in use
  if(liveRoomsMap.has(roomID)){
    roomNameInUseError = true;
    res.render("createRoomError");
    console.log("Duplicate room ID use attempted.");
  } else {
    liveRoomsMap.set(roomID, roomID);
    const room = new Room({ roomID: roomID });
    room.save();
    res.redirect("/room/" + roomID);
    io.emit("addRoom", roomID);
  }
});

/** Handle routing for redirecting the user to create a user name before joining the room. */
app.get("/room/:room", urlencodedParser, (req, res) => {
  //if requested room does not exist, route user to error page
  if(liveRoomsMap.has(req.params.room)){
    console.log("Room: " + req.params.room + " created");
    res.render("room", {
      roomID: req.params.room
     });
   } else {
     res.render("invalidRoomError", {
       roomID: req.params.room
     });
   }
});

io.on("connection", (socket) => {

   /**
   * When the user joins a room, add them to the user list and alert the room.
   * @param {String} roomId - name of the joined room
   * @param {String} username - name of the user
   */
  socket.on("join-room", (roomID, userName) => {
    socket.join(roomID);
    users.removeUser(userName);
    users.addUser(socket.id, userName, roomID);
    io.to(roomID).emit("updateUsersList", users.getUserList(roomID));
    io.to(roomID).emit("newUser", userName);
    console.log("User " + userName + " has joined room " + roomID + ".");

    /**
     * When a user sends a public message to the room, post the message to every user in the room.
     * @param {Array} storedMessage - array of message date, time, sender, and message
     */
    socket.on("message", (storedMessage) => {
      io.to(roomID).emit("createPublicMessage", storedMessage);
      const message = new Message({
        name: storedMessage.name,
        time: storedMessage.time,
        message: storedMessage.message
      });

      /** Post public message to room file in database. */
      Room.findOne({roomID: roomID}, function (error, doc){
        if(error){
          console.log("Error: " + error);
        } else {
          doc.messages.push(message);
          doc.save();
        }
      });
    });

     /**
     * When a user sends a private message, send that message to selected user
     * @param {String} sender - name of the user who sent the message
     * @param {String} receiver - name of the user to receive the message
     * @param {Array} date - date object of the time message was sent
     * @param {Array} message - message contents
     */
    socket.on("direct-message", (sender, receiver, date, message) => {
      receiverSocket = users.getUserFromName(receiver);
      io.to(receiverSocket.id).emit("new-direct-message", sender, date, message);
    });

    /** When a user requests to view public messages posted before they joined, grab those messages and post to user. */
    socket.on("getAllMessages", () => {
      let previousMessages = true;
      Room.findOne({ roomID: roomID}, function (error, doc){
        if(error){
          console.log("Error: " + error);
        } else if (doc.messages.length === 0){
          let noMessages = "No previous messages to display.";
          previousMessages = false;
          io.to(socket.id).emit("getMessageResponse", noMessages, previousMessages);
        } else {
          io.to(socket.id).emit("getMessageResponse", doc.messages, previousMessages);
        }
      });
    });
  });

  /** When a user requests to view public messages posted before they joined, grab those messages and post to user. */
  socket.on("checkRoomList", () => {
    if(liveRoomsMap.size == 0){
      console.log("No rooms to list.");
    } else {
      let roomsArray = [];
      liveRoomsMap.forEach((item, i) => {
        roomsArray.push(item);
      });

      io.to(socket.id).emit("addRoomList", roomsArray);
    }
  });

  /** When a user loads the main page and there are created rooms, post the created rooms to the user. */
  socket.on("disconnect", () => {
    let user = users.removeUser(socket.id);
    if(user){
      userList = users.getUserList(user.room);
      io.to(user.room).emit("updateUsersList", userList);
      io.to(user.room).emit("userDisconnect", user.name);
      console.log("User " + user.name + " has left room " + user.room + ".");
      console.log("User count of room " + user.room + ": " + userList.length);
      //when there are no users left in the room, delete the room
      if(userList.length == 0){
        console.log("Room " + user.room + " is now empty.");
        Room.findOneAndDelete({roomID: user.room}, function (error) {
          if (error){
            console.log(error);
          } else {
            console.log("Empty room deleted.");
          }
        });
        liveRoomsMap.delete(user.room);
        io.emit("removeRoom", user.room);  
      }
      
    }
  });

});

server.listen(3000);
