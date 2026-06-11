const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Hero = require("../models/Hero");
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

function formatSkills(skills) {
  if (typeof skills === "string") {
    return skills.split(",").map(s => {
      const trimmed = s.trim();
      return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
    }).filter(Boolean);
  } else if (Array.isArray(skills)) {
    return skills.map(s => {
      const trimmed = String(s).trim();
      return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
    }).filter(Boolean);
  }
  return [];
}

// Post route to login user or hero (unified)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Invalid password format. Password must be a combination of letters and numbers only, with no special characters or symbols." });
    }

    // 1. Try to find user in User collection
    const user = await User.findOne({ email: email.trim() });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
      const userData = user.toObject();
      delete userData.password;
      return res.status(200).json({
        message: "User Login Successful",
        user: userData,
        role: "user",
      });
    }

    // 2. Try to find hero in Hero collection
    const hero = await Hero.findOne({ email: email.trim() });
    if (hero) {
      const isMatch = await bcrypt.compare(password, hero.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
      const heroData = hero.toObject();
      delete heroData.password;
      return res.status(200).json({
        message: "Hero Login Successful",
        user: heroData,
        role: "hero",
      });
    }

    // 3. Neither found
    return res.status(404).json({ message: "User/Hero not found with this email" });
  } catch (error) {
    console.log("Error in unified login route:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
});

// Post route to register user
router.post("/register/user", async (req, res) => {
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

// Post route to register hero
router.post("/register/hero", async (req, res) => {
  try {
    const { fullname, email, password, skills, phone, city, heroCode, "hero-code": heroCodeDash } = req.body;
    const suppliedCode = heroCode || heroCodeDash;

    if (!suppliedCode || suppliedCode !== "0512") {
      return res.status(400).json({ message: "Invalid hero code. Registration is restricted." });
    }

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

    // Check if hero already exists
    const existingHero = await Hero.findOne({ email: email.trim() });
    if (existingHero) {
      return res.status(400).json({ message: "Hero with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parse skills from comma-separated string to array and capitalize
    const skillsArray = formatSkills(skills);

    const newHero = new Hero({
      fullname,
      email: email.trim(),
      password: hashedPassword,
      skills: skillsArray,
      phone: typeof phone === 'string' ? Number(phone.trim()) : phone,
      city,
    });

    await newHero.save();

    // Return hero data without password
    const heroData = newHero.toObject();
    delete heroData.password;

    res.status(201).json({
      message: "Hero Registered Successfully",
      hero: heroData,
    });
  } catch (error) {
    console.log("Error in hero register route:", error);
    res.status(500).json({
      message: "Error registering hero",
      error: error.message,
    });
  }
});

module.exports = router;
