const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    }, 
    password: {
        type: String,
        require: true
    },
    gender: { 
        type: String, 
        enum: ["Male", "Female"], 
        required: true 
    },
    resetOTP: { 
        type: String 
    },
    otpExpires: { 
        type: Date 
    },
    token: {
        type: String
    },
}, {timestamps: true});

const user = mongoose.model('user', userSchema);
module.exports = user;


