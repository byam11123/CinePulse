import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { ValidationError, InternalServerError } from "../utils/errors.js";

export async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      throw new ValidationError("All fields are required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
    }
    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters long");
    }
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      throw new ValidationError("Email already in use");
    }
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      throw new ValidationError("Username already exist");
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
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ValidationError("All fields are required");
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      throw new ValidationError("Invalid credentials");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new ValidationError("Invalid credentials");
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
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie("jwt-cinepulse");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function authCheck(req, res, next) {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
}
