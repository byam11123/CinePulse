import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { generateTokenAndSetCookie } from '../utils/generateToken.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class AuthService {
  /**
   * Register a new user
   */
  async register(userData, res) {
    console.log('[AUTH SERVICE] Starting user registration process...');
    const { username, email, password } = userData;

    // Validate input
    console.log('[AUTH SERVICE] Validating user data...');
    this.validateUserData({ username, email, password });

    // Check if user already exists
    console.log('[AUTH SERVICE] Checking if user already exists...');
    await this.checkUserExists(email, username);

    // Create new user
    console.log('[AUTH SERVICE] Creating new user...');
    const PROFILE_PIC_URL = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];
    const image = PROFILE_PIC_URL[Math.floor(Math.random() * PROFILE_PIC_URL.length)];

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[AUTH SERVICE] Password hashed successfully');

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      image,
    });

    const savedUser = await newUser.save();
    console.log('[AUTH SERVICE] User saved to database:', savedUser._id);

    // Generate JWT token for new user
    console.log('[AUTH SERVICE] Generating JWT token and setting cookie...');
    const token = generateTokenAndSetCookie(savedUser._id, res);
    console.log('[AUTH SERVICE] Token generated and cookie set');

    logger.info('New user registered', { userId: savedUser._id, email: savedUser.email });

    return savedUser;
  }

  /**
   * Login user
   */
  async login(credentials, res) {
    console.log('[AUTH SERVICE] Starting login process...');
    const { email, password } = credentials;

    if (!email || !password) {
      console.log('[AUTH SERVICE] Missing credentials');
      throw new ValidationError("All fields are required");
    }

    console.log('[AUTH SERVICE] Finding user by email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[AUTH SERVICE] User not found with email:', email);
      throw new ValidationError("Invalid credentials");
    }

    console.log('[AUTH SERVICE] Comparing passwords...');
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log('[AUTH SERVICE] Password incorrect for user:', email);
      throw new ValidationError("Invalid credentials");
    }

    // Generate JWT token
    console.log('[AUTH SERVICE] Password correct, generating JWT token...');
    const token = generateTokenAndSetCookie(user._id, res);
    console.log('[AUTH SERVICE] Token generated and cookie set for user:', user._id);

    logger.info('User logged in', { userId: user._id, email: user.email });

    return {
      ...user.toObject(),
      password: undefined // Don't return password
    };
  }

  /**
   * Logout user
   */
  async logout(res) {
    console.log('[AUTH SERVICE] Initiating logout process...');
    res.clearCookie("jwt-cinepulse");
    console.log('[AUTH SERVICE] Cookie cleared');
    logger.info('User logged out');
    return { message: "Logged out successfully" };
  }

  /**
   * Get authenticated user
   */
  async getAuthUser(userId) {
    console.log('[AUTH SERVICE] Fetching authenticated user:', userId);
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('[AUTH SERVICE] User not found:', userId);
      throw new ValidationError("User not found");
    }
    console.log('[AUTH SERVICE] User found:', user._id);
    return user;
  }

  /**
   * Validate user data
   */
  validateUserData({ username, email, password }) {
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
  }

  /**
   * Check if user already exists
   */
  async checkUserExists(email, username) {
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      throw new ValidationError("Email already in use");
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      throw new ValidationError("Username already exist");
    }
  }
}

export default new AuthService();