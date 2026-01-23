import { ValidationError, InternalServerError } from "../utils/errors.js";
import AuthService from "../services/AuthService.js";
import UserService from "../services/UserService.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export async function signup(req, res, next) {
  try {
    console.log('[AUTH CONTROLLER] Signup initiated with data:', {
      email: req.body.email,
      username: req.body.username
    });

    const userData = req.body;
    const newUser = await AuthService.register(userData, res);

    console.log('[AUTH CONTROLLER] User registered successfully:', {
      userId: newUser._id,
      email: newUser.email
    });

    res.status(201).json({
      success: true,
      user: {
        ...newUser.toObject(),
        password: "", // Don't send password in response
      },
    });
  } catch (error) {
    console.error('[AUTH CONTROLLER] Signup error:', error.message);
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    console.log('[AUTH CONTROLLER] Login initiated with email:', req.body.email);

    const credentials = req.body;
    const loginResult = await AuthService.login(credentials, res);

    console.log('[AUTH CONTROLLER] Login successful for user:', {
      userId: loginResult._id,
      email: loginResult.email
    });

    res.status(200).json({
      success: true,
      user: loginResult,
    });
  } catch (error) {
    console.error('[AUTH CONTROLLER] Login error:', error.message);
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    console.log('[AUTH CONTROLLER] Logout initiated for user:', req.user?.id || 'unknown');

    const result = await AuthService.logout(res);

    console.log('[AUTH CONTROLLER] Logout successful:', result);

    res.status(200).json(result);
  } catch (error) {
    console.error('[AUTH CONTROLLER] Logout error:', error.message);
    next(error);
  }
}

export async function authCheck(req, res, next) {
  try {
    console.log('[AUTH CONTROLLER] Auth check for user:', req.user._id);

    const user = await AuthService.getAuthUser(req.user._id);

    console.log('[AUTH CONTROLLER] Auth check successful for user:', {
      userId: user._id,
      email: user.email
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('[AUTH CONTROLLER] Auth check error:', error.message);
    next(error);
  }
}
