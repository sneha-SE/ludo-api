const users = require("../models/userSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

function createToken(data) {
  return jwt.sign(data, process.env.JWT_SECRET);
}

const getTokenData = async (token) => {
  let adminData = await users.findOne({ token: token }).exec();
  console.log("gett", token);

  return adminData;
};

const signup = async (req, res) => {
  let { username, email, password, gender } = req.body;

  gender = Number(gender) === 0 ? "Male" : "Female";

  try {
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password:", hashedPassword);

    const newUser = new users({
      username,
      email,
      password: hashedPassword,
      gender,
    });
    const saveUsers = await newUser.save();
    console.log("Saved User:", saveUsers);

    const token = await createToken(req.body);

    await users.findOneAndUpdate(
      { _id: saveUsers._id },
      { $set: { token: token } },
      { new: true }
    );

    res.status(201).json({
      status: true,
      message: "User signed up successfully",
      token: token,
    });
  } catch (error) {
    console.log("Error in signup:", error);
    res.status(500).json({ status: false, error: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingEmail = await users.findOne({ email });
    if (!existingEmail) {
      return res.status(400).json({ error: "email not found", status: false });
    }

    const isMatch = await bcrypt.compare(password, existingEmail.password);
    if (!isMatch) {
      return res.status(400).json({ status: false, error: "invalid password" });
    }

    const token = existingEmail.token;
    res.status(200).json({
      message: "login successful",
      data: existingEmail,
    });
  } catch (error) {
    console.error("Error in login", error);
    res.status(500).json({ status: false, error: "Server error" });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await users.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    user.resetOTP = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 min

    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await users.findOne({ resetOTP: otp });

    if (!user || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body; // Email frontend se ayegi

    if (!email) {
      return res
        .status(400)
        .json({ status: false, message: "Email is required" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password using email
    const updatedUser = await users.findOneAndUpdate(
      { email: email },
      { password: hashedPassword }
    );

    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    res.json({ status: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

const userCanChangeUserName = async (req, res) => {
  try {
    const { email, newUsername } = req.body;

    if (!email || !newUsername || newUsername.trim() === "") {
      return res.status(400).json({
        status: false,
        message: "Email and new username are required",
      });
    }

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const existingUser = await users.findOne({ username: newUsername });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: false, message: "Username already exists" });
    }

    let usernameParts = user.username.split("");
    let baseUsername = newUsername;
    let uniqueCode =
      usernameParts.length > 1 && /^\d{4}$/.test(usernameParts[1])
        ? usernameParts[1]
        : Math.floor(1000 + Math.random() * 9000);

    

    let finalUsername = `${baseUsername}${uniqueCode}`;
    let isUsernameTaken = await users.findOne({ username: finalUsername });

    while (isUsernameTaken) {
      uniqueCode = Math.floor(1000 + Math.random() * 9000);
      finalUsername = `${baseUsername}_${uniqueCode}`;
      isUsernameTaken = await users.findOne({ username: finalUsername });
    }

    
    user.username = finalUsername;
    await user.save();

    res.status(200).json({
      status: true,
      message: "Username updated successfully",
      username: user.username,
    });
  } catch (error) {
    console.error("Error in userCanChangeUserName:", error);
    res
      .status(500)
      .json({ status: false, message: "Failed to update username" });
  }
};

const userCanChangeAv = async (req, res) => {
  try {
    const { username, avatar, bodyPart, color } = req.body;

    // ✅ Validate input
    if (
      username.trim() === "" ||
      (avatar !== 0 && avatar !== 1) ||
      (bodyPart !== 0 && bodyPart !== 1) ||
      color < 0 ||
      color > 6
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid input values",
      });
    }

    // ✅ Find user
    const user = await users.findOne({ username });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // ✅ Update avatar settings
    user.avatar = avatar;
    user.bodyPart = bodyPart;
    user.color = color;
    await user.save();

    res.status(200).json({
      status: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
      bodyPart: user.bodyPart,
      color: user.color,
    });
  } catch (error) {
    console.error("Error in userCanChangeAv:", error);
    res.status(500).json({ status: false, message: "Failed to update avatar" });
  }
};

module.exports = {
  login,
  signup,
  verifyOTP,
  sendResetOTP,
  getTokenData,
  resetPassword,
  userCanChangeUserName,
  userCanChangeAv,
};
