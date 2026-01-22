import express from "express";
import {
  searchPerson,
  searchMovie,
  searchTv,
  removeItemFromSearchHistory,
  getSearchHistory,
} from "../controllers/search.controller.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";
const router = express.Router();

router.get("/person/:query", apiRateLimiter, searchPerson);
router.get("/movie/:query", apiRateLimiter, searchMovie);
router.get("/tv/:query", apiRateLimiter, searchTv);
router.get("/history", apiRateLimiter, getSearchHistory);

router.delete("/history/:id", apiRateLimiter, removeItemFromSearchHistory);

export default router;
