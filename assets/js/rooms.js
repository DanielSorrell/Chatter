let socket = io();

$('form').submit(() => {
  socket.emit('createRoomRequest', socket.id);
});

/**
 * When the user attempts to create a room with a pre existing room's name, alert the user.
 * @param {String} errorMessage - Message to alert user that the request room name is already in use 
 */
socket.on('duplicateRoomError', (errorMessage) => {
  console.log('error msg received.');
  alert(errorMessage);
});
