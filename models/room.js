const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var Message = require('./message').schema;
var DirectConversation = require('./directConversation').schema;

const roomSchema = new Schema({
  roomID: {
    type: String,
    required: true
  },
  messages: [Message],
  directConversations: [DirectConversation]
  });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
