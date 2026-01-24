import express from "express";
import {
  authCheck,
  login,
  logout,
  signup,
} from "../../controllers/auth.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
// import { validate, schemas } from "../../middleware/validation.js"; // Temporarily commented out

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/authCheck", protectRoute, authCheck);

export default router;
