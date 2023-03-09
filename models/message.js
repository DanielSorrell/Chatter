const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const msgSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  time: {
    type: Object,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

const Message = mongoose.model('Message', msgSchema);
module.exports = Message;
