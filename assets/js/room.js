const socket = io();
const userList = document.getElementById("userList");
const roomAndUserContainer = document.getElementById("roomAndUserContainer");
const publicMessageContainer = document.getElementById("publicMessagesContainer");
const privateMessagesContainer = document.getElementById("privateMessagesContainer");
const userName = prompt("Enter your name:");
let privateConversationView = false;
let inboxView = true; //empty inbox is displayed by default
let privateConversationsMap = new Map();

/** when the user connects, join room and display username. */
socket.on("connect", () => {
  socket.emit("joinRoom", ROOM_ID, userName);
  socket.emit("getPreviousPublicMessages"); //send request to check for public messages sent before the user joined the room
  const userNameHeader = document.createElement("h2");
  userNameHeader.setAttribute("id", "userNameHeader");
  userNameHeader.innerHTML = "Your name: " + userName;
  roomAndUserContainer.appendChild(userNameHeader);
});

/** Appends the user's inbox that contains private messages sent and received between other users. */
let renderInbox = () => {
  inboxView = true;
  privateConversationView = false;
  /** create and append html elemnts to display inbox */
  const inboxDiv = document.createElement("div");
  inboxDiv.setAttribute("id", "inbox");
  const inboxHeader = document.createElement("p");
  inboxHeader.innerHTML = "<b>Inbox</b><br>";
  inboxDiv.appendChild(inboxHeader);
  const inboxConversationList = document.createElement("div")
  inboxConversationList.setAttribute("id", "inboxConversationList");
  inboxDiv.appendChild(inboxConversationList);
  document.getElementById("privateMessagesContainer").appendChild(inboxDiv);
  privateConversationsMap.forEach((key, value) => {
    let hasUnreadMessages = key.hasUnreadMessages;
    /** create html to display usernames */
    const conversationPreview = document.createElement("p");
    conversationPreview.setAttribute("id", "message:" + value);
    conversationPreview.innerHTML = value;
    if(hasUnreadMessages == true){ //if private conversation contains unread messages, add new styling to alert user
      let unreadMessagesDiv;
      if(document.getElementById("unreadMessagesDiv") == null){
        unreadMessagesDiv = document.createElement("div");
        unreadMessagesDiv.setAttribute("id", "unreadMessagesDiv");
        inboxConversationList.prepend(unreadMessagesDiv);
      } else {
        unreadMessagesDiv = document.getElementById("unreadMessagesDiv");
      }
      conversationPreview.setAttribute("class", "unreadMessages");
      unreadMessagesDiv.prepend(conversationPreview);
    } else { //if there are read messages, display the usernames with regular styling
      let readMessagesDiv;
      if(document.getElementById("readMessagesDiv") == null){
        readMessagesDiv = document.createElement("div");
        readMessagesDiv.setAttribute("id", "readMessagesDiv");
        inboxConversationList.appendChild(readMessagesDiv);
      } else {
        readMessagesDiv = document.getElementById("readMessagesDiv");
      }
      conversationPreview.setAttribute("class", "readMessages");
      readMessagesDiv.prepend(conversationPreview);
    }
    /** When the user clicks on another user from the inbox, display the private conversation with that user */
    conversationPreview.addEventListener("click", () => {
      if(hasUnreadMessages == true){
        key.hasUnreadMessages = false;
      }
      inboxDiv.remove();
      privateConversationView = false;
      inboxView = true;
      renderConversation(value);
    });
  });
}

/**
 * Returns a div with the user message to append to the page.
 * @param {Array} message - array of message date, time, sender, and message
 * @param {Boolean} isPrivate - is true if sent uesr message is private
 */
let formatMessageAndTime = (message, isPrivate) => {
  const formatting = document.createElement("div");
  const currentDate = new Date();

  if(message.date !== currentDate.toLocaleDateString()){ //if message was sent on previous date than current date, display previous date
    let dateStickyBox = document.createElement("div");
    dateStickyBox.setAttribute("class", "stickyBox");
    dateStickyBox.innerHTML = message.date;
    formatting.appendChild(dateStickyBox);
  }

  let input = document.createElement("p");
  input.innerHTML = "<b>" + message.sender + "</b> - " + message.time + "<br>" + message.message;
  formatting.appendChild(input);

  if(isPrivate == true){ //format read and unread private messages
    if(message.sender == "You"){
      formatting.classList.add("sentDirectMessage");
      formatting.sender = "You";
    } else {
      formatting.classList.add("receivedPrivateMessage");
    }
  } else {
    formatting.classList.add("message");
  }

  return formatting;
}

/**
 * Returns a div containing the private conversation with the selected user.
 * @param {String} user - name of the user to see messages to/from
 */
let renderConversation = (user) => {

  if(privateConversationView == true && document.getElementById("userToMessage").innerHTML == user){
    console.log("conversation with " + user + " already displayed.");
  } else {
  inboxView = false;
  if(privateConversationView == false){ //if user is in inbox view, switch to conversation view
    privateConversationView = true;
    if(document.getElementById("inbox") !== null){ //if inbox is still appended, remove to display conversation
      document.getElementById("inbox").remove();
    }

    /** Create html elements for conversation view. */
    const conversationHeader = document.createElement("div");
    const userToMessage = document.createElement("div");
    userToMessage.setAttribute("id", "userToMessage");
    userToMessage.innerHTML = user;
    conversationHeader.setAttribute("id", "conversationHeader");
    const inboxRedirectButton = document.createElement("input");
    inboxRedirectButton.setAttribute("class", "button");
    inboxRedirectButton.type = "button";
    inboxRedirectButton.value = "Back";
    const conversation = document.createElement("div");
    conversation.setAttribute("id", "conversation");
    const conversationView = document.createElement("div");
    conversationView.setAttribute("id", "conversationView");

    const privateMessageInputContainer = document.createElement("div");
    privateMessageInputContainer.setAttribute("id", "privateMessageInputContainer");

    const privateMessageInput = document.createElement("input");
    privateMessageInput.type = "text";
    privateMessageInput.setAttribute("class", "input");

    const sendPrivateMessageButton = document.createElement("input");
    sendPrivateMessageButton.type = "button";
    sendPrivateMessageButton.setAttribute("class", "button");
    sendPrivateMessageButton.value = "Send";

    /** Send private message to current user on button click. */
    sendPrivateMessageButton.addEventListener("click", (e) => {
      if (privateMessageInput.value.length !== 0) {
        const currentDate = new Date();

        const storedMessage = {
          sender: "You",
          date: currentDate.toLocaleDateString(),
          time: currentDate.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}),
          message: privateMessageInput.value
        };

        if(privateConversationsMap.has(user)){ //if private conversation has already been started, add to current conversation, else start a new conversation
          let stateAndMessagesObj = privateConversationsMap.get(user);
          stateAndMessagesObj.messagesArray.push(storedMessage);
        } else {
          let stateAndMessagesObj = {
            hasUnreadMessages: false,
            messagesArray: []
          };
          stateAndMessagesObj.messagesArray.push(storedMessage);
          privateConversationsMap.set(user, stateAndMessagesObj);
        }
        conversation.appendChild(formatMessageAndTime(storedMessage, true));
        socket.emit("newPrivateMessage", userName, storedMessage, user);
        privateMessageInput.value = "";
      }
    });

    /** Send private message to current user on enter keystroke. */
    privateMessageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && privateMessageInput.value.length !== 0){
        const currentDate = new Date();

        const storedMessage = {
          sender: "You",
          date: currentDate.toLocaleDateString(),
          time: currentDate.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}),
          message: privateMessageInput.value
        };

        if(privateConversationsMap.has(user)){ //if private conversation has already been started, add to current conversation, else start a new conversation.
          let stateAndMessagesObj = privateConversationsMap.get(user);
          stateAndMessagesObj.messagesArray.push(storedMessage);
        } else {
          let stateAndMessagesObj = {
            hasUnreadMessages: false,
            messagesArray: []
          };
          stateAndMessagesObj.messagesArray.push(storedMessage);
          privateConversationsMap.set(user, stateAndMessagesObj);
        }
        conversation.appendChild(formatMessageAndTime(storedMessage, true));
        socket.emit("newPrivateMessage", userName, storedMessage, user);
        privateMessageInput.value = "";
      }
    });

    /** Append created html elements for conversation view. */
    conversationHeader.appendChild(userToMessage);
    conversationHeader.appendChild(inboxRedirectButton);
    conversationView.appendChild(conversationHeader);
    conversationView.appendChild(conversation);
    privateMessageInputContainer.appendChild(privateMessageInput);
    privateMessageInputContainer.appendChild(sendPrivateMessageButton);
    conversationView.appendChild(privateMessageInputContainer);
    privateMessagesContainer.appendChild(conversationView);

    /** when the user clicks back button, switch to inbox view and remove conversation. */
    inboxRedirectButton.addEventListener("click", () => {
      conversationView.remove();
      renderInbox();
    });

    } else { //if user already has a different conversation displayed, remove current conversation to display selected conversation
      document.getElementById("userToMessage").innerHTML = user;
      if(document.getElementsByClassName("c") !== null){ //remove any messages from old conversation
        const previousConversation = document.getElementById("conversation");
        while(previousConversation.children.length != 0) {
          previousConversation.removeChild(previousConversation.lastChild);
        }
      }
    }

    if(privateConversationsMap.has(user)){ //if a conversation with selected user has already been started, grab it
      const messageArray = privateConversationsMap.get(user);
      if(messageArray.hasUnreadMessages = true){ //mark any unread messages as read
        messageArray.hasUnreadMessages = false;
      }
      for(let i = 0; i < messageArray.messagesArray.length; i++){
        conversation.appendChild(formatMessageAndTime(messageArray.messagesArray[i], true));
      }
    }
  }
}

renderInbox();

/**
 * When the user joins the room and/or another user joins or disconnects, grab the new list of users in the room.
 * @param {Array} users - array of all users in the room
 */
let numUsers;
socket.on("updateUserList", (users) => {
  let ul = document.createElement("ul");
  ul.setAttribute("id", "dynamicUserList");
  numUsers = 0;
  for(let i = 0; i < users.length; i++){ //for each user, display their username on the list
    numUsers++;
    const li = document.createElement("li");
    li.setAttribute("class", "userInRoom");
    li.setAttribute("id", users[i]);
    li.innerHTML = users[i];
    ul.appendChild(li);
    if(userName !== users[i]){ //prevent a user from messaging theirself
      /** when the user clicks on another user from the list, display private conversation of selected user. */
      li.addEventListener("click", () => {
        if(privateConversationView == false){
          renderConversation(users[i]);
        } else { //if a private conversation is not already displayed, switch to conversation view
          privateConversationView = true;
          renderConversation(users[i]);
        }
      });
    }
  }
  while(userList.children.length != 0) {
    userList.removeChild(userList.lastChild);
  }
  const userCount = document.createElement("h3");
  userCount.innerHTML = "Users: " + numUsers;
  userList.appendChild(userCount);
  userList.appendChild(ul);
});

/**
 * When a new user joins the room, notify other users through the public message container.
 * @param {String} newUser - name of the new user
 */
socket.on("newUser", (newUser) => {
  let notification = document.createElement("p");
  notification.innerHTML = "User " + newUser + " has joined the room.";
  notification.setAttribute("class", "notification");
  publicMessageContainer.appendChild(notification);
})

/**
 * When another user leaves the room, notify other users through the public message container.
 * @param {String} disconnectedUser - name of the disconneted user
 */
socket.on("userDisconnect", (disconnectedUser) => {
  let notification = document.createElement("p");
  notification.innerHTML = "User " + disconnectedUser + " has left the room.";
  notification.setAttribute("class", "notification");
  publicMessageContainer.appendChild(notification);
})

/**
 * When there are public messages sent before the user joined the room,
 * grab those messages and display them if button is clicked.
 * @param {Array} messages - array of the previous public messages
 */
socket.on("previousPublicMessages", (messages) => {
  const loadPreviousMessagesContainer = document.createElement("div");
  loadPreviousMessagesContainer.setAttribute("id", "loadPreviousMessages");
  const centerDiv = document.createElement("div");
  centerDiv.setAttribute("class", "centerDivContainer");
  const showPreviousMessagesButton = document.createElement("input");
  showPreviousMessagesButton.type = "button";
  showPreviousMessagesButton.value = "Load previous messages";
  showPreviousMessagesButton.setAttribute("id", "showPreviousMessages");
  showPreviousMessagesButton.setAttribute("class", "button");
  const endOfMessages = document.createElement("p");
  endOfMessages.innerHTML = "End of previous messages.";
  endOfMessages.setAttribute("class", "notification");
  centerDiv.appendChild(showPreviousMessagesButton);
  loadPreviousMessagesContainer.appendChild(centerDiv);
  publicMessageContainer.appendChild(loadPreviousMessagesContainer);

  showPreviousMessagesButton.addEventListener("click", () => {
    while(loadPreviousMessagesContainer.children.length != 0) {
      loadPreviousMessagesContainer.removeChild(loadPreviousMessagesContainer.lastChild);
    }
    for(let i = 0; i < messages.length; i++){
      loadPreviousMessagesContainer.appendChild(formatMessageAndTime(messages[i], false));
    }
    loadPreviousMessagesContainer.appendChild(endOfMessages);
  });
});

const copyRoomLink = document.getElementById("shareRoomLink");
const sendButton = document.getElementById("sendMessage");
const messageInput = document.getElementById("messageInput");

/** If user clicks share invite link button, copy URL to user clipboard. */
copyRoomLink.addEventListener("click", () => {
  navigator.clipboard.writeText(location.href);
});

/** If user clicks send message button, send user's message input. */
sendButton.addEventListener("click", (e) => {
  if (messageInput.value.length !== 0) {
    const currentDate = new Date();
    const storedMessage = {
      sender: userName,
      date: currentDate.toLocaleDateString(),
      time: currentDate.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}),
      message: messageInput.value
    };
    socket.emit("newPublicMessage", storedMessage);
    messageInput.value = "";
  }
});

/** If user presses enter, send user's message input. */
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && messageInput.value.length !== 0){
    const currentDate = new Date();
    const storedMessage = {
      sender: userName,
      date: currentDate.toLocaleDateString(),
      time: currentDate.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}),
      message: messageInput.value
    };
    socket.emit("newPublicMessage", storedMessage);
    messageInput.value = "";
  }
});

/**
 * When a user sends a public message, display that message.
 * @param {Array} storedMessage - array of message date, time, sender, and message
 */
socket.on("postPublicMessage", (storedMessage) => {
  let message = formatMessageAndTime(storedMessage, false);
  if(storedMessage.sender == userName){
    message.classList.add("sentPublicMessage");
  } else {
    message.classList.add("receivedPublicMessage");
  }
  let clearFloat = document.createElement('div');
  clearFloat.setAttribute('class', 'clearFloat');
  publicMessageContainer.appendChild(message);
  publicMessageContainer.appendChild(clearFloat);
});

/**
 * When the user receives a private message from another user,
 * store the message and display the message or notify the user.
 * @param {String} sender - name of the message sender
 * @param {Array} message - array of message date, time, sender, and message
 */
socket.on("newPrivateMessage", (sender, message) => {
  const storedMessage = {
    sender: sender,
    date: message.date,
    time: message.time,
    message: message.message
  };
  let stateAndMessagesObj;
  if(privateConversationsMap.has(sender)){
    stateAndMessagesObj = privateConversationsMap.get(sender);
    stateAndMessagesObj.hasUnreadMessages = true;
    stateAndMessagesObj.messagesArray.push(storedMessage);
  } else {
    stateAndMessagesObj = {
      hasUnreadMessages: true,
      messagesArray: []
    };
    stateAndMessagesObj.messagesArray.push(storedMessage);
    privateConversationsMap.set(sender, stateAndMessagesObj);
  }

  if(inboxView == true){ //hanldes all inbox conditions
    let stateAndMessagesObj = privateConversationsMap.get(sender);
    let conversationPreview;
    if(document.getElementById("message:" + sender) == null){ //if conversation with message sender previously does not exist, display message sender userName with new message styles
      conversationPreview = document.createElement("p");
      conversationPreview.setAttribute("id", "message:" + sender);
      conversationPreview.setAttribute("class", "unreadMessages");
      conversationPreview.innerHTML = sender;
    let unreadMessagesDiv;
    if(document.getElementById("unreadMessagesDiv") == null){ //if there are no previous unread messages, create and prepend the div to display usernames with unread messages from
      unreadMessagesDiv = document.createElement("div");
      unreadMessagesDiv.setAttribute("id", "unreadMessagesDiv");
      const inboxConversationList = document.getElementById("inboxConversationList");
      inboxConversationList.prepend(unreadMessagesDiv);
    } else {
      unreadMessagesDiv = document.getElementById("unreadMessagesDiv");
    }
    unreadMessagesDiv.appendChild(conversationPreview);
    /** when the user clicks on a username from the inbox, switch to conversation view and display that conversation */
    conversationPreview.addEventListener("click", () => {
      stateAndMessagesObj.hasUnreadMessages = false;
      document.getElementById("inbox").remove();
      privateConversationView = false;
      renderConversation(sender);
    });
    }
    if(document.getElementById("message:" + sender).className == "readMessages"){ //if a conversation with message sender exists with all read messages, add new styling to alert user of new message
      conversationPreview = document.getElementById("message:" + sender);
      conversationPreview.setAttribute("class", "unreadMessages");
      stateAndMessagesObj.hasUnreadMessages = true;
    }
  } else if(privateConversationView == true && document.getElementById("userToMessage").innerHTML == sender){ //if the current conversation view is with message sender, display that message in the conversation
    stateAndMessagesObj.hasUnreadMessages = false;
    document.getElementById("conversation").appendChild(formatMessageAndTime(storedMessage, true));
  } else if(privateConversationView == true && document.getElementById("userToMessage").innerHTML !== sender) //if the current conversation is not with message sender, mark conversation as unread messages
    stateAndMessagesObj.hasUnreadMessages = true;
});
