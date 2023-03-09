let socket = io();
let liveRoomsPlaceholder = document.getElementById('liveRooms');
let roomsListHeader = document.getElementById('roomsListHeader');
let activeRoomsMap = new Map();

//when a user loads the homepage, check for live rooms to display
socket.on('connect', () => {
  socket.emit('checkRoomList');
});

/**
 * When the user connects and there is more than one created room, display all the rooms.
 * @param {array} roomsArray - array of all created rooms
 */
socket.on('addRoomList', (roomsArray) => {
  console.log('Rooms: ' + roomsArray);
  let roomsDiv;
  if(document.getElementById('roomsDiv') == null){
    roomsDiv = document.createElement('div');
    roomsDiv.setAttribute('id', 'roomsDiv');
    liveRoomsPlaceholder.append(roomsDiv);
    roomsListHeader.innerHTML = 'Active rooms:';
  } else {
    roomsDiv = document.getElementById('roomsDiv');
  }

  for(let i = 0; i < roomsArray.length; i++) {
    let roomToAdd = document.createElement('a');
    roomToAdd.innerHTML = roomsArray[i];
    roomToAdd.setAttribute('id', 'join room:' + roomsArray[i]);
    roomToAdd.setAttribute('class', 'roomRedirect');
    roomToAdd.setAttribute('href', 'http://localhost:3000/room/' + roomsArray[i]);
    roomsDiv.appendChild(roomToAdd);
    activeRoomsMap.set(roomsArray[i], roomsArray[i]);
  }
  liveRoomsPlaceholder.append(roomsDiv);
});

/**
 * When a new room is created, add it to the room list.
 * @param {String} roomId - name of the new room
 */
socket.on('addRoom', (roomID) => {
  let roomsDiv;
  if(document.getElementById('roomsDiv') == null){
    roomsListHeader.innerHTML = 'Active rooms:';
    roomsDiv = document.createElement('div');
    roomsDiv.setAttribute('id', 'roomsDiv');
    liveRoomsPlaceholder.append(roomsDiv);
  } else {
    roomsDiv = document.getElementById('roomsDiv');
  }
  activeRoomsMap.set(roomID, roomID);
  let roomToAdd = document.createElement('a');
  roomToAdd.innerHTML = roomID;
  roomToAdd.setAttribute('id', 'join room:' + roomID);
  roomToAdd.setAttribute('class', 'roomRedirect');
  roomToAdd.setAttribute('href', 'http://localhost:3000/room/' + roomID);
  roomsDiv.appendChild(roomToAdd);
});

/**
 * When a room has zero users, delete the room.
 * @param {String} roomId - name of the room to delete
 */
socket.on('removeRoom', (roomID) => {
  activeRoomsMap.delete(roomID);
  let emptyRoom = document.getElementById('join room:' + roomID);
  if(activeRoomsMap.size == 0){
    document.getElementById('roomsDiv').remove();
  } else {
    emptyRoom.remove();
  }
});
