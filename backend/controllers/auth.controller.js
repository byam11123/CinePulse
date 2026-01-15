import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export async function signup(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exist" });
    }

    const PROFILE_PIC_URL = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

    const image =
      PROFILE_PIC_URL[Math.floor(Math.random() * PROFILE_PIC_URL.length)];

    // Hash the password before saving
    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      image,
    });

    generateTokenAndSetCookie(newUser._id, res);
    await newUser.save();
    res.status(201).json({
      success: true,
      user: {
        ...newUser._doc,
        password: "", // Don't send password in response
      },
    });
  } catch (error) {
    console.log("Error in signup controller: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({
      success: true,
      user: {
        ...user._doc,
        password: "", // Don't send password in response
      },
    });
  } catch (error) {
    console.error("Error in login controller: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("jwt-cinepulse");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

export async function authCheck(req, res) {
  try {
    console.log("req.user:", req.user);
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error("Error in authCheck controller: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}
