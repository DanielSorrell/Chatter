const socket = io();
const liveRoomsContainer = document.getElementById("liveRoomsContainer");
const roomsListHeader = document.getElementById("roomsListHeader");
let activeRoomsMap = new Map();

/** When the user connects, send request for list of live rooms. */
socket.on("connect", () => {
  socket.emit("checkRoomList");
});

/**
 * When the user connects and there is more than one created room, display all the rooms.
 * @param {array} roomsArray - array of all created rooms
 */
socket.on("addRoomList", (roomsArray) => {
  let roomsDiv;
  if(document.getElementById("roomsDiv") == null){
    roomsDiv = document.createElement("div");
    roomsDiv.setAttribute("id", "roomsDiv");
    liveRoomsContainer.append(roomsDiv);
    roomsListHeader.innerHTML = "Active rooms:";
  } else {
    roomsDiv = document.getElementById("roomsDiv");
  }
  for(let i = 0; i < roomsArray.length; i++) {
    let roomToAdd = document.createElement("a");
    roomToAdd.innerHTML = roomsArray[i];
    roomToAdd.setAttribute("id", "join room:" + roomsArray[i]);
    roomToAdd.setAttribute("class", "roomRedirect");
    roomToAdd.setAttribute("href", location.href + "room/" + roomsArray[i]);
    roomsDiv.appendChild(roomToAdd);
    activeRoomsMap.set(roomsArray[i], roomsArray[i]);
  }
  liveRoomsContainer.append(roomsDiv);
});

/**
 * When a new room is created, add it to the room list.
 * @param {String} roomId - name of the new room
 */
socket.on("addRoom", (roomId) => {
  let roomsDiv;
  if(document.getElementById("roomsDiv") == null){
    roomsListHeader.innerHTML = "Active rooms:";
    roomsDiv = document.createElement("div");
    roomsDiv.setAttribute("id", "roomsDiv");
    liveRoomsContainer.append(roomsDiv);
  } else {
    roomsDiv = document.getElementById("roomsDiv");
  }
  activeRoomsMap.set(roomId, roomId);
  const roomToAdd = document.createElement("a");
  roomToAdd.innerHTML = roomId;
  roomToAdd.setAttribute("id", "join room:" + roomId);
  roomToAdd.setAttribute("class", "roomRedirect");
  roomToAdd.setAttribute("href", location.href + "room/" + roomId);
  roomsDiv.appendChild(roomToAdd);
});

/**
 * When a room has zero users, delete the room.
 * @param {String} roomId - name of the room to delete
 */
socket.on("removeRoom", (roomId) => {
  activeRoomsMap.delete(roomId);
  const emptyRoom = document.getElementById("join room:" + roomId);
  if(activeRoomsMap.size == 0){
    document.getElementById("roomsDiv").remove();
    roomsListHeader.innerHTML = "No other rooms to join";
  } else {
    emptyRoom.remove();
  }
});
