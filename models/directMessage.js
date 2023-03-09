const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const directMessageSchema = new Schema({
  sender: String,
  receiver: String,
  time: String,
  message: String
});

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
module.exports = DirectMessage;
