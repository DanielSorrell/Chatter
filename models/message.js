const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const msgSchema = new Schema({
  sender: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

const Message = mongoose.model("Message", msgSchema);
module.exports = Message;
