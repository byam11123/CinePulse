import express from "express";
import {
  authCheck,
  login,
  logout,
  signup,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.post("/logout", authRateLimiter, logout);

router.get("/authCheck", protectRoute, authRateLimiter, authCheck);

export default router;
