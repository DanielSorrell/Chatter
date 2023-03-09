let socket = io();

const userName = prompt("Enter your name");
const userList = document.getElementById("userList");
const userInfo = document.getElementById("userInfo");
const messageContainer = document.getElementById("messages");
const loadPublicMessageContainer = document.getElementById("loadMessageDiv");
let conversationMap = new Map();
//get direct message div for inbox and conversation views
const roomMessageWindow = document.getElementById("roomMessageWindow");
const sendDirectMessageContainer = document.createElement("div");
sendDirectMessageContainer.setAttribute("id", "sendDirectMessageContainer");
//empty inbox is loaded by default
let directConversationView = false;
let inboxView = true;

/** When the user connects, join room and display username. */
socket.on("connect", () => {
  socket.emit("join-room", ROOM_ID, userName);
  //send request to check for previous messages sent in the room
  socket.emit("getAllMessages"); 
  const userInfoDisplay = document.createElement("h2");
  userInfoDisplay.setAttribute("id", "h2userInfo");
  userInfoDisplay.innerHTML = "Your name: " + userName;
  userInfo.append(userInfoDisplay);
});

let previousPublicMessages;
/**
 * When the server responds from a request to check for any previous messages
 * that were sent in the room before the user joined the room, display those
 * messages if any.
 * @param {Array/String} messages - String that says no previous messages found or an array of messages if found
 * @param {Boolean} previousMessages - True if any previous messages were found, false if not
 */
socket.on("getMessageResponse", (messages, previousMessages) => {
  if(previousMessages == false){ //if there are no previous messages, display that to user
    previousPublicMessages = document.createElement("p");
    previousPublicMessages.innerHTML = messages;
  } else {
    //if previous messages exist, display them to user
    previousPublicMessages = formatMessages(messages);
    previousPublicMessages.setAttribute("id", "previousPublicMessages");
  }
});

//display previous public messages when button is clicked
loadPublicMessageContainer.addEventListener("click", () => {
  document.getElementById("loadMessageDiv").innerHTML = "";
  document.getElementById("loadMessageDiv").appendChild(previousPublicMessages);
});

/** Appends the user"s inbox that contains previews of direct messages between other users, similar to iphone messaging app. */
let renderInbox = () => {
  //set current view to inbox view to show inbox is being rendered
  inboxView = true;
  directConversationView = false;
  //create and append html elements to display inbox
  const inboxDiv = document.createElement("div");
  inboxDiv.setAttribute("id", "inbox");
  let inboxHeader = document.createElement("p");
  inboxHeader.innerHTML = "<b>Inbox</b><br>";
  inboxDiv.appendChild(inboxHeader);
  let inboxConversationList = document.createElement("div")
  inboxConversationList.setAttribute("id", "inboxConversationList");
  inboxDiv.appendChild(inboxConversationList);
  document.getElementById("roomMessageWindow").appendChild(inboxDiv);
  //display usernames of other users in direct conversation with user
  conversationMap.forEach((key, value) => {
    let hasUnreadMessages = key.hasUnreadMessages;
    let conversationPreview = document.createElement("p");
    conversationPreview.setAttribute("id", "message:" + value);
    conversationPreview.innerHTML = value;
    //if direct conversation contains unread messages, change username(s) color to show
    if(hasUnreadMessages){
      let unreadMessagesDiv;
      //if there are no previous unread messages, create and append the div to display new unread messages
      if(!document.getElementById("unreadMessagesDiv")){
        unreadMessagesDiv = document.createElement("div");
        unreadMessagesDiv.setAttribute("id", "unreadMessagesDiv");
        inboxConversationList.prepend(unreadMessagesDiv);
      } else { 
        //if there are already unread messages, grab the div containing them
        unreadMessagesDiv = document.getElementById("unreadMessagesDiv");
      }
      conversationPreview.setAttribute("class", "unreadMessages");
      unreadMessagesDiv.prepend(conversationPreview);
    } else {
      //if there are read messages, display the usernames in regular color
      let readMessagesDiv;
      //if there are no previous read messages, create and append the div to display new read messages
      if(!document.getElementById("readMessagesDiv")){ 
        readMessagesDiv = document.createElement("div");
        readMessagesDiv.setAttribute("id", "readMessagesDiv");
        inboxConversationList.append(readMessagesDiv);
      } else { 
        //if there are already read messages, grab the div containing them and prepend
        readMessagesDiv = document.getElementById("readMessagesDiv");
      }
      conversationPreview.setAttribute("class", "readMessages");
      readMessagesDiv.prepend(conversationPreview);
    }
    /** When the user clicks on another user from the inbox, display the conversation with that user */
    conversationPreview.addEventListener("click", () => {
      if(hasUnreadMessages){
        key.hasUnreadMessages = false;
      }
      inboxDiv.remove();
      directConversationView = false;
      inboxView = true;
      renderConversation(value);
    });
  });
}

/**
 * Takes a username and returns a div containing the direct conversation with the selected user.
 * @param {string} user - name of the user to see messages to/from
 */
let renderConversation = (user) => {
  if(directConversationView && document.getElementById("userToMessage").innerHTML == user){
    console.log("Conversation with " + user + " is already displayed.");
  } else {
    //switch to conversation view
    inboxView = false; 
    //if user is in inbox view, switch to conversation view
    if(directConversationView == false){ 
      directConversationView = true;
      //if inbox is still appended, remove to display conversation
      if(document.getElementById("inbox")){ 
        document.getElementById("inbox").remove();
      }

      const conversationHeader = document.createElement("div");
      const userToMessage = document.createElement("span");
      userToMessage.setAttribute("id", "userToMessage");
      userToMessage.innerHTML = user;
      conversationHeader.setAttribute("id", "conversationHeader");
      const inboxRedirectButton = document.createElement("input");
      inboxRedirectButton.type = "button";
      inboxRedirectButton.setAttribute("id", "inboxRedirectButton");
      inboxRedirectButton.value = "Back";
      const conversationView = document.createElement("div");
      conversationView.setAttribute("id", "conversationView");

      const directMessageInputContainer = document.createElement("div");
      directMessageInputContainer.setAttribute("id", "directMessageInputContainer");

      let directMessageInput = document.createElement("input");
      directMessageInput.setAttribute("id", "directMessageInput");
      directMessageInput.type = "text";

      const sendDirectMessageButton = document.createElement("input");
      sendDirectMessageButton.type = "button";
      sendDirectMessageButton.setAttribute("id", "sendDirectMessageButton");
      sendDirectMessageButton.setAttribute("class", "sendMessageButton");
      sendDirectMessageButton.value = "Send";

      /** If user clicks send message button, send user"s message input. */
      sendDirectMessageButton.addEventListener("click", (e) => {
        if (directMessageInput.value.length !== 0) {
          let currentDate = new Date();
          let messageDate = {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth(),
            day: currentDate.getDate(),
            hour: currentDate.getHours(),
            minutes: currentDate.getMinutes()
          };

          let storedMessage = {
            name: "You",
            time: messageDate,
            message: directMessageInput.value
          };

          //if direct conversation has already been started, add to current conversation, else start a new conversation
          if(conversationMap.has(user)){
            let stateAndMessagesObj = conversationMap.get(user);
            stateAndMessagesObj.messagesArray.push(storedMessage);
          } else {
            let stateAndMessagesObj = {
              hasUnreadMessages: false,
              messagesArray: []
            };
            stateAndMessagesObj.messagesArray.push(storedMessage);
            conversationMap.set(user, stateAndMessagesObj);
          }
          conversation.append(formatSingleMessage(storedMessage));
          socket.emit("direct-message", userName, user, messageDate, directMessageInput.value);
          directMessageInput.value = "";
        }
      });

      /** If user presses enter, send user"s message input. */
      directMessageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && directMessageInput.value.length !== 0){
          let currentDate = new Date();
          let messageDate = {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth(),
            day: currentDate.getDate(),
            hour: currentDate.getHours(),
            minutes: currentDate.getMinutes()
          };

          let storedMessage = {
            name: "You",
            time: messageDate,
            message: directMessageInput.value
          };

          //if direct conversation has already been started, add to current conversation, else start a new conversation
          if(conversationMap.has(user)){
            let stateAndMessagesObj = conversationMap.get(user);
            stateAndMessagesObj.messagesArray.push(storedMessage);
          } else {
            let stateAndMessagesObj = {
              hasUnreadMessages: false,
              messagesArray: []
            };
            stateAndMessagesObj.messagesArray.push(storedMessage);
            conversationMap.set(user, stateAndMessagesObj);
          }
          conversation.append(formatSingleMessage(storedMessage));
          socket.emit("direct-message", userName, user, messageDate, directMessageInput.value);
          directMessageInput.value = "";
        }
      });

      /** Append created html elements for conversation view. */
      conversationHeader.appendChild(inboxRedirectButton);
      conversationHeader.appendChild(userToMessage);
      conversationView.appendChild(conversationHeader);
      directMessageInputContainer.appendChild(directMessageInput);
      directMessageInputContainer.appendChild(sendDirectMessageButton);
      conversationView.appendChild(directMessageInputContainer);
      roomMessageWindow.appendChild(conversationView);

      /** When the user clicks back button, switch to inbox view and remove conversation. */
      inboxRedirectButton.addEventListener("click", () => {
        //loadedConversation = "";
        conversationView.remove();
        //if conversation is still appended, remove to display inbox
        if(document.getElementById("conversation")){ 
          document.getElementById("conversation").remove();
        }
        renderInbox();
      });

  //if user already has a different conversation displayed, remove current conversation to display selected conversation
    } else {
      document.getElementById("userToMessage").innerHTML = user;
      //if there are displayed messages from another conversation, remove them
      if(document.getElementsByClassName("directMessage")){ 
        const previousConversation = document.getElementById("conversation");
        while(previousConversation.children.length != 0) {
          previousConversation.removeChild(previousConversation.lastChild);
        }
        document.getElementById("conversation").remove();
      }
    }

    //if a conversation with selected user has already been started, grab it
    if(conversationMap.has(user)){ 
      let messageArray = conversationMap.get(user);
      //mark any unread messages that will be displayed as read
      if(messageArray.hasUnreadMessages){
        messageArray.hasUnreadMessages = false;
      }
      let conversationHeader = document.getElementById("conversationHeader");
      conversationHeader.insertAdjacentElement("afterend", formatMessages(messageArray.messagesArray));
    } else { 
      //create conversation div to hold messages
      let conversationDiv = document.createElement("div");
      let conversationHeader = document.getElementById("conversationHeader");
      conversationDiv.setAttribute("id", "conversation");
      conversationHeader.insertAdjacentElement("afterend", conversationDiv);
      
    }
  }
}

/**
 * Takes an array of messages and returns a div containing formatted/styled messages
 * @param {array} messageArray - array of messages
 * @returns {div} conversation - div containing formatted/styled messages
 */
let formatMessages = (messageArray) => {
  let conversation = document.createElement("div");
  let currentDate = new Date();
  let postedDate = {};
  conversation.setAttribute("id", "conversation");

  for(let i = 0; i < messageArray.length; i++){

  //if year of message post is past the current year, post that year
  if(messageArray[i].time.year < currentDate.getFullYear()){

    //if message post year is different than the previous year, post that year
    if(postedDate.year !== messageArray[i].time.year){
      //post year sticky element
      //if matching year, year is not displayed to assume current year
      //if next year, post next year over previous year
      postedDate.year = messageArray[i].time.year;
      let yearStickyBox = document.createElement("div");
      yearStickyBox.setAttribute("class", "messageDateBox");
      yearStickyBox.innerHTML = postedDate.year;
      conversation.appendChild(yearStickyBox);
      }
    }

    //if message post month is different than current month, post that month
    if(postedDate.month !== messageArray[i].time.month){
      //post year sticky element
      //if matching year, year is not displayed to assume current year
      //if next year, post next year over previous year
      postedDate.month = messageArray[i].time.month;
      let monthStickyBox = document.createElement("div");
      monthStickyBox.setAttribute("class", "messageDateBox");
      const getWordedMonth = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      monthStickyBox.innerHTML = getWordedMonth[postedDate.month];
      conversation.appendChild(monthStickyBox);
      }

      //if message post number day is different than current day, post that day
      if(postedDate.day !== messageArray[i].time.day){
        postedDate.day = messageArray[i].time.day;
        let dayStickyBox = document.createElement("div");
        dayStickyBox.setAttribute("class", "messageDateBox");
        dayStickyBox.innerHTML = postedDate.day;
        conversation.appendChild(dayStickyBox);
      }

      let currHour, currMinute, meridiem;
      if(messageArray[i].time.hour == 0){
        currHour = "12";
        meridiem = "am";
      } else if(messageArray[i].time.hour > 12){
        currHour = messageArray[i].time.hour - 12;
        meridiem = "pm";
      } else {
        currHour = messageArray[i].time.hour;
        meridiem = "am";
      }

      if(messageArray[i].time.minutes < 10){
        currMinute = "0" + messageArray[i].time.minutes;
      } else {
        currMinute = messageArray[i].time.minutes;
      }

      let timeStamp = currHour + ":" + currMinute + " " + meridiem;
      let input = document.createElement("p");
      input.innerHTML = "<b>" + messageArray[i].name + "</b> - " + timeStamp + "<br>" + messageArray[i].message;
      let msg = document.createElement("div");

      if(messageArray[i].name == "You" || messageArray[i].name == userName){
        msg.classList.add("sentMessage");
      } else {
        msg.classList.add("receivedMessage");
      }
      msg.classList.add("message");
      msg.append(input);
      conversation.append(msg);
    }

  return conversation;
}

/**
 * Takes a message object and returns a formatted/styled message to display
 * @param {object} message - Object containing message information
 * @returns {div} messageToDisplay - div containing formatted/styled message
 */
let formatSingleMessage = (message) => {

  let messageToDisplay = document.createElement("div");
  let currentDate = new Date();

  if(message.name == "You" || message.name == userName){
    messageToDisplay.classList.add("sentMessage");
    messageToDisplay.sender = "You";
  } else {
    messageToDisplay.classList.add("receivedMessage");
  }

  messageToDisplay.classList.add("message");

  //if message post year is different than the previous year, post that year
  if(message.time.year < currentDate.getFullYear()){
    let yearStickyBox = document.createElement("div");
    yearStickyBox.setAttribute("class", "messageDateBox");
    yearStickyBox.innerHTML = message.time.year;
    messageToDisplay.appendChild(yearStickyBox);
  }

  //if message post month is different than current month, post that month
  if(message.time.month !== currentDate.getMonth()){
    let monthStickyBox = document.createElement("div");
    monthStickyBox.setAttribute("class", "messageDateBox");
    const getWordedMonth = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    monthStickyBox.innerHTML = getWordedMonth[message.time.month];
    messageToDisplay.appendChild(monthStickyBox);
  }

  //if message post number day is different than current day, post that day
  if(message.time.day !== currentDate.getDate()){
    let dayStickyBox = document.createElement("div");
    dayStickyBox.setAttribute("class", "messageDateBox");
    dayStickyBox.innerHTML = message.time.day;
    messageToDisplay.appendChild(dayStickyBox);
  }

  let input = document.createElement("p");
  let currHour, currMinute, meridiem;
  if(message.time.hour == 0){
    currHour = "12";
    meridiem = "am";
  } else if(message.time.hour > 12){
    currHour = message.time.hour - 12;
    meridiem = "pm";
  } else {
    currHour = message.time.hour;
    meridiem = "am";
  }

  if(message.time.minutes < 10){
    currMinute = "0" + message.time.minutes;
  } else {
    currMinute = message.time.minutes;
  }

  let timeStamp = currHour + ":" + currMinute + " " + meridiem;
  input.innerHTML = "<b>" + message.name + "</b> - " + timeStamp + "<br>" + message.message;
  messageToDisplay.append(input);

  return messageToDisplay;
}

//inbox is displayed by default
renderInbox();

//on page load or another users joins/leaves, update room username roster
let numUsers;
socket.on("updateUsersList", function (users) {
  let ul = document.createElement("ul");
  ul.setAttribute("id", "dynamicUserList");
  numUsers = 0;
  //for each user, display their username on the list
  users.forEach(function (user) {
    numUsers++; //update room user count
    let li = document.createElement("li");
    li.setAttribute("class", "userInRoom");
    li.setAttribute("id", user);
    li.innerHTML = user;
    ul.appendChild(li);
    //prevent a user from messaging their self
    if(userName !== user){ 
      //when user clicks on another user from the list, display direct conversation of selected user
      li.addEventListener("click", () => {
        //if a direct conversation is already displayed, keep conversation view
        if(directConversationView == false){ 
          renderConversation(user);
        } else {
          //if a direct conversation is not already displayed, switch to conversation view 
          directConversationView = true;
          renderConversation(user);
        }
      });
    }
  });
  userList.innerHTML = "";
  let userCount = document.createElement("h3");
  userCount.innerHTML = "Users: " + numUsers;
  //display room user count and room user list
  userCount.setAttribute("class", "centerText");
  userList.append(userCount);
  userList.appendChild(ul);
});

//grab direct message input and send direct message button
const message = document.getElementById("messageInput");
const sendButton = document.getElementById("sendMessage");

/** If user clicks send message button, send user"s message input. */
sendButton.addEventListener("click", (e) => {
  console.log(message.value);
  //if user input is not empty, grab user input
  if (message.value.length !== 0) { 
    let currentDate = new Date();
    let messageDate = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      day: currentDate.getDate(),
      hour: currentDate.getHours(),
      minutes: currentDate.getMinutes()
    };

    let storedMessage = {
      name: userName,
      time: messageDate,
      message: message.value
    };

    socket.emit("message", storedMessage);
    message.value = "";
  }
});

/** If user presses enter, send user"s message input. */
message.addEventListener("keydown", (e) => {
  console.log(e);
  //if user input is not empty, grab user input
  if (e.key === "Enter" && message.value.length !== 0){ 
    let currentDate = new Date();
    let messageDate = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      day: currentDate.getDate(),
      hour: currentDate.getHours(),
      minutes: currentDate.getMinutes()
    };

    let storedMessage = {
      name: userName,
      time: messageDate,
      message: message.value
    };

    socket.emit("message", storedMessage);
    message.value = "";
  }
});

/**
 * When a new user joins the room, notify other users through the public message container.
 * @param {string} newUser - username of the new user
 */
socket.on("newUser", (newUser) => {
  let notification = document.createElement("p");
  notification.innerHTML = newUser + " has joined the room.";
  notification.setAttribute("class", "notification");
  messageContainer.appendChild(notification);
  messageContainer.scrollTop = messageContainer.scrollHeight;
});

/**
 * When another user leaves the room, notify other users through the public message container.
 * @param {string} disconnectedUser - name of the disconnected user
 */
socket.on("userDisconnect", (disconnectedUser) => {
  let notification = document.createElement("p");
  notification.innerHTML = disconnectedUser + " has left the room.";
  notification.setAttribute("class", "notification");
  messageContainer.appendChild(notification);
  messageContainer.scrollTop = messageContainer.scrollHeight;
})

/**
 * When a user sends a public message, display that message.
 * @param {object} storedMessage - Object from database containing message information
 */
socket.on("createPublicMessage", (storedMessage) => {
  messageContainer.append(formatSingleMessage(storedMessage));
  messageContainer.scrollTop = messageContainer.scrollHeight;
});

//when a new direct message is sent to the user, store the message
/**
 * When the user receives a direct message from another user,
 * store the message and display the message or notify the user.
 * @param {string} sender - name of the message sender
 * @param {object} date - Date object of when message was sent
 * @param {string} message - String of message contents
 */
socket.on("new-direct-message", (sender, date, message) => {
  //format message
  let storedMessage = {
    name: sender,
    time: date,
    message: message
  };

  let stateAndMessagesObj;
  //if a conversation with message sender previously exists, store message to existing conversation
  if(conversationMap.has(sender)){
    stateAndMessagesObj = conversationMap.get(sender);
    stateAndMessagesObj.hasUnreadMessages = true;
    stateAndMessagesObj.messagesArray.push(storedMessage);
  } else {
    //if a conversation with message sender does not exist, create conversation and store message
    stateAndMessagesObj = {
      hasUnreadMessages: true,
      messagesArray: []
    };
    stateAndMessagesObj.messagesArray.push(storedMessage);
    conversationMap.set(sender, stateAndMessagesObj);
  }

  //if current view is inbox, alert user of new direct message
  if(inboxView){ 

    let stateAndMessagesObj = conversationMap.get(sender);
    let conversationPreview;
    //if conversation with message sender previously does not exist, display message sender userName with new message styles
    if(!document.getElementById("message:" + sender)){ 
      //create html to display message sender username
      conversationPreview = document.createElement("p");
      conversationPreview.setAttribute("id", "message:" + sender);
      conversationPreview.setAttribute("class", "unreadMessages");
      conversationPreview.innerHTML = sender;
      let unreadMessagesDiv;
      //if there are no previous unread messages, create and prepend the div to display usernames with unread messages from
      if(!document.getElementById("unreadMessagesDiv")){ 
        unreadMessagesDiv = document.createElement("div");
        unreadMessagesDiv.setAttribute("id", "unreadMessagesDiv");
        let inboxConversationList = document.getElementById("inboxConversationList");
        inboxConversationList.prepend(unreadMessagesDiv);
      } else {
        //grab existing div containing usernames with unread messages from
        unreadMessagesDiv = document.getElementById("unreadMessagesDiv");
      }
      unreadMessagesDiv.append(conversationPreview);
      //when user clicks on a username from the inbox, switch to conversation view and display that conversation
      conversationPreview.addEventListener("click", () => {
        stateAndMessagesObj.hasUnreadMessages = false;
        document.getElementById("inbox").remove();
        directConversationView = false;
        renderConversation(sender);
      });
    }
    //if a conversation with message sender exists with no previous unread messages, add new styling of new message from user message sender
    if(document.getElementById("message:" + sender).className == "readMessages"){ 
    //add new styling to message sender username
      conversationPreview = document.getElementById("message:" + sender);
      conversationPreview.setAttribute("class", "unreadMessages");
      stateAndMessagesObj.hasUnreadMessages = true;
    }
    //if the current conversation view is with message sender, display that message in the conversation
  } else if(directConversationView && document.getElementById("userToMessage").innerHTML == sender){ 
    stateAndMessagesObj.hasUnreadMessages = false;
    document.getElementById("conversation").appendChild(formatSingleMessage(storedMessage));
    roomMessageWindow.scrollTop = roomMessageWindow.scrollHeight;
    //if the current conversation view is not with message sender, update the inbox to show new message alert
  } else if(directConversationView && document.getElementById("userToMessage").innerHTML !== sender) 
    stateAndMessagesObj.hasUnreadMessages = true;
});
