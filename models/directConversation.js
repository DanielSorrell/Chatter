const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var DirectMessage = require('./directMessage').schema;

const directConversationSchema = new Schema({
  initiatorUser: String,
  user2: String,
  directMessages: [DirectMessage]
});

const DirectConversation = mongoose.model('DirectConversation', directConversationSchema);
module.exports = DirectConversation;
