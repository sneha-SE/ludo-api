const Room = require("../models/roomSchema");
const { v4: uuidv4 } = require("uuid");
const users = require("../models/userSchema");
const jwt = require("jsonwebtoken");


const createRoom = async (req, res) => {
  try {
    const { isPublic, roomName } = req.body;

    const roomId = uuidv4().slice(0, 6);
    console.log("Generated Room ID:", roomId);

    if (!roomName) {
      return res
        .status(400)
        .json({ status: false, message: "Please write a room name" });
    }

    
    let roomType = Number(isPublic) === 1 ? "private" : "public";

    const newRoom = new Room({
      roomId,
      roomName,
      players: [],
      status: "waiting",
      maxPlayers: 4,
      type: roomType, 
    });

    await newRoom.save();
    console.log("Room Created Successfully:", newRoom);

    res.status(200).json({
      status: true,
      message: "Room created successfully",
      roomId,
      players: newRoom.players,
      type: newRoom.type, 
    });
  } catch (error) {
    console.error("Error in createRoom:", error);
    res.status(500).json({
      status: false,
      message: "Room creation failed",
      error: error.message,
    });
  }
};


const joinRoom = async (req, res) => {
  const { roomId } = req.body;

  try {
    const existingRoom = await Room.findOne({ roomId });

    if (!existingRoom) {
      return res.status(400).json({ status: false, message: "Room not found" });
    }

    const user = await users.findOne().sort({ createdAt: -1 });

    if (!user) {
      return res.status(400).json({ status: false, message: "No users found" });
    }

    const userId = user._id;
    const username = user.username;

    if (existingRoom.players.includes(userId)) {
      return res
        .status(400)
        .json({ status: false, message: "You are already joined" });
    }

    if (existingRoom.players.length >= 4) {
      return res.status(400).json({ status: false, message: "Room is full" });
    }

    existingRoom.players.push(userId);

    if (existingRoom.players.length === 4) {
      existingRoom.status = "full";
    }

    await existingRoom.save();
    res.status(200).json({
      status: true,
      message: "Joined room",
      room: existingRoom,
      userId,
      username,
    });
  } catch (error) {
    console.error("Error in joinRoom:", error);
    res
      .status(500)
      .json({
        status: false,
        message: "Failed to join room",
        error: error.message,
      });
  }
};

const getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" }).populate(
      "players",
      "username email"
    );

    if (rooms.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "No public rooms found" });
    }

    
    const formattedRooms = rooms.map((room) => ({
      roomName: room.roomName, 
      players: room.players,
      playerCount: room.players.length,
      status: room.status,
      createdAt: room.createdAt,
    }));

    res.status(200).json({
      status: true,
      data: formattedRooms,
      message: "All public rooms fetched successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Failed to fetch public rooms" });
  }
};


const leaveRoom = async (req, res) => {
  const { roomId } = req.body;

  try {
    const room = await Room.findOne({ roomId }).populate("players"); // Players fetch kar rahe hain

    if (!room) {
      return res.status(404).json({ status: false, message: "Room not found" });
    }

    // 🔹 User ko room.players list se find karo (assuming ki user ka email token me hai)
    const user = room.players.find((player) => player.email === req.email); 
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found in room" });
    }

    console.log("Players before leaving:", room.players);
    console.log("User Leaving:", user._id);

    // 🔹 User ko room.players list se hatao
    room.players = room.players.filter((player) => player._id.toString() !== user._id.toString());

    console.log("Players after leaving:", room.players);

    // 🔹 User ko DB se delete karo
    await users.deleteOne({ _id: user._id });

    // 🔥 Agar room khali ho gaya to use delete kar do
    if (room.players.length === 0) {
      await Room.deleteOne({ roomId });
      return res.status(200).json({ status: true, message: "Room deleted as it was empty!" });
    }

    // ✅ Room ko update karna zaroori hai agar players bache ho
    room.status = "waiting";
    await room.save();

    res.status(200).json({ status: true, message: "Left the room and user deleted!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: false, message: "Failed to leave room" });
  }
};


module.exports = {
  createRoom,
  joinRoom,
  getPublicRooms,
  leaveRoom,
};
