const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var Message = require("./message").schema;

const roomSchema = new Schema({
  roomId: {
    type: String,
    required: true
  },
  messages: [Message],
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
