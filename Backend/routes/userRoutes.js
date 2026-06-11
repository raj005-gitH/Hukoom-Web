const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;
const phoneRegex = /^[6-9]\d{9}$/;

function validateEmail(email) {
  return typeof email === "string" && emailRegex.test(email.trim());
}

function validatePassword(password) {
  return typeof password === "string" && passwordRegex.test(password);
}

function validatePhone(phone) {
  if (typeof phone === "string") {
    return phoneRegex.test(phone.trim());
  } else if (typeof phone === "number") {
    return phoneRegex.test(String(phone));
  }
  return false;
}

// Post route to register user
router.post("/register-user", async (req, res) => {
  try {
    const { username, email, password, phone, city } = req.body;

    // Validate email, password & phone format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Invalid password format. Password must be a combination of letters and numbers only, with no special characters or symbols." });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ message: "Invalid phone number. Must be a 10-digit Indian phone number starting with 6-9." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email: email.trim(),
      password: hashedPassword,
      phone: typeof phone === 'string' ? Number(phone.trim()) : phone,
      city,
    });

    await newUser.save();

    // Return user data without password
    const userData = newUser.toObject();
    delete userData.password;

    res.status(201).json({
      message: "User Registered Successfully",
      user: userData,
    });
  } catch (error) {
    console.log("Error in user register route:", error);
    res.status(500).json({
      message: "Error saving user",
      error: error.message,
    });
  }
});

// Post route to login user
router.post("/login-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Invalid password format. Password must be a combination of letters and numbers only, with no special characters or symbols." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Return user data without password
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "User Login Successful",
      user: userData,
    });
  } catch (error) {
    console.log("Error in user login route:", error);
    res.status(500).json({
      message: "Error logging in user",
      error: error.message,
    });
  }
});

module.exports = router;
