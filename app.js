const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*"}});
const {Users} = require("./assets/js/users.js");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Room = require("./models/room");
const Message = require("./models/message");
const port = process.env.PORT || 3000
let users = new Users();
let liveRoomsMap = new Map();
app.set("view engine", "ejs");
app.use(express.static("assets"));
app.use(express.urlencoded({extended: false}));
dotenv.config();

/** Connect to mongodb database. */
const dbURI = "mongodb+srv://" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => console.log("Database connection successful."))
  .catch((error) => console.log("Database connection error: " + error));

/** Handle routing for the home page. */
app.get("/", (req, res) => {
  res.render("home");
});

/** Handle routing for the create room page */
app.get("/createRoom", (req, res) => {
  res.render("createRoom");
});

/** Handle routing for posting and loading a room after creation */
app.post("/createRoom", (req, res) => {
  if(liveRoomsMap.has(req.body.roomId)){ //block attempts of creating a room with the same room Id already in use
    res.render("createRoomError");
  } else {
    liveRoomsMap.set(req.body.roomId, 0);
    const room = new Room({ roomId: req.body.roomId });
    room.save();
    res.redirect("/room/" + req.body.roomId + "/" + req.body.username);
    io.emit("addRoom", req.body.roomId);
  }
});

/** Handle routing for redirecting the user to create a user name before joining the room. */
app.get("/room/:roomId", (req, res) => {
  if(liveRoomsMap.has(req.params.roomId)){ //if requested room does not exist, route user to error page
    console.log("Room: " + req.params.roomId + " created");
    res.render("createUsername", {
      roomId: req.params.roomId
     });
   } else {
     res.render("invalidRoomError", {
       roomId: req.params.roomId
     });
   }
});

/** Handle routing to desired room once a valid user name is created. */
app.post("/createUsername", (req, res) => {
  res.redirect("/room/" + req.body.roomId + "/" + req.body.username);
});

/** Handle routing for joining a room once the user creates a valid user name. */
app.get("/room/:roomId/:username", (req, res) => {
  if(liveRoomsMap.has(req.params.roomId)){ //if requested room does not exist, route user to error page
    res.render("room", {
      roomId: req.params.roomId,
      username: req.params.username
     });
   } else {
     res.render("invalidRoomError", {
       roomId: req.params.roomId
     });
   }
});

io.on("connection", (socket) => {

  /**
   * When the user joins a room, add them to the user list and alert the room.
   * @param {String} roomId - name of the joined room
   * @param {String} username - name of the user
   */
  socket.on("joinRoom", (roomId, username) => {
    socket.join(roomId);
    users.addUser(socket.id, username, roomId);
    liveRoomsMap.set(roomId, liveRoomsMap.get(roomId)+1);
    io.to(roomId).emit("updateUserList", users.getUserList(roomId));
    io.to(roomId).emit("newUser", username);

    /**
     * When a user sends a public message to the room, post the message to every user in the room.
     * @param {Array} storedMessage - array of message date, time, sender, and message
     */
    socket.on("newPublicMessage", (storedMessage) => {
      const message = new Message({
        sender: storedMessage.sender,
        date: storedMessage.date,
        time: storedMessage.time,
        message: storedMessage.message
      });

      /** Post public message to room file in database. */
      Room.findOne({roomId: roomId}, function (error, doc){
        if(error){
          console.log("Error saving message to room document in database: " + error);
        } else {
          doc.messages.push(message);
          doc.save();
        }
      });
      io.to(roomId).emit("postPublicMessage", storedMessage); //send message to each user in the room
    });

    /**
     * When a user sends a private message, send that message to selected user
     * @param {String} sender - name of the user who sent the message
     * @param {Array} message - array of message date, time, sender, and message
     * @param {String} receiver - name of the user to receive the message
     */
    socket.on("newPrivateMessage", (sender, message, receiver) => {
      receiverSocket = users.getUserByName(receiver);
      io.to(receiverSocket.id).emit("newPrivateMessage", sender, message);
    });

    /** When a user requests to view public messages posted before they joined, grab those messages and post to user. */
    socket.on("getPreviousPublicMessages", () => {
      Room.findOne({ roomId: roomId }, function (error, doc){
        if(error){
          console.log("Error retreiving previous messages: " + error);
        } else if (doc.messages.length !== 0) {
          io.to(socket.id).emit("previousPublicMessages", doc.messages);
        }
      });
    });

  });

  /** When a user loads the main page and there are created rooms, post the created rooms to the user. */
  socket.on("checkRoomList", () => {
    if(liveRoomsMap.size == 0){
      console.log("No live rooms to list.");
    } else {
      let roomsArray = [];
      liveRoomsMap.forEach((item, i) => { //convert map to array since map exporting is not supported in socket.io
        roomsArray.push(i);
      });
      io.to(socket.id).emit("addRoomList", roomsArray); //add list of created rooms to home page
    }
  });

  /** When a user disconnects, alert other users in the room. */
  socket.on("disconnect", () => {
    let user = users.removeUser(socket.id);
    if(user){
      liveRoomsMap.set(user.room, liveRoomsMap.get(user.room)-1);
      userList = users.getUserList(user.room);
      io.to(user.room).emit("updateUserList", userList);
      io.to(user.room).emit("userDisconnect", user.name);
      if(liveRoomsMap.get(user.room) == 0){ //if there are no users left in the room, delete the room
        Room.findOneAndDelete({roomId: user.room}, function (error) {
          if (error){
            console.log("Error deleting empty room: " + error);
          } else {
            liveRoomsMap.delete(user.room);
            console.log("Empty room " + user.room + " deleted.");
            io.emit("removeRoom", user.room); //remove room from home page
          }
        });
      }
    }
  });

});

server.listen(port);
