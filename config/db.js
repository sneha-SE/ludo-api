const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        console.log(" Connecting to MongoDB..."); // Debugging log
        console.log(" MongoDB URI:", process.env.DATA_BASE_URI); // Check if URI is loaded

        const conn = await mongoose.connect(process.env.DATA_BASE_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(` MongoDB Connection Failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

