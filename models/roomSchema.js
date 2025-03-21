const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    unique: true,
    require: true,
  },
  roomId: {
    type: String,
    unique: true,
    required: true,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  status: {
    type: String,
    enum: ["waiting", "active", "full"],
    default: "waiting",
  },
  type: {
    type: String,
    enum: ["public", "private"],
    
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
