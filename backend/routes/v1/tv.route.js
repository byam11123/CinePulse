import express from "express";
import {
  getTrendingTv,
  getTvTrailers,
  getTvDetails,
  getSimiliarTv,
  getCategoryTvs,
} from "../../controllers/tv.controller.js";
import { apiRateLimiter } from "../../middleware/rateLimiter.js";
// import { validate, schemas } from "../../middleware/validation.js"; // Temporarily commented out

const router = express.Router();

router.get("/trending", apiRateLimiter, getTrendingTv);
router.get("/:id/trailers", apiRateLimiter, getTvTrailers);
router.get("/:id/details", apiRateLimiter, getTvDetails);
router.get("/:id/similar", apiRateLimiter, getSimiliarTv);
router.get("/:category", apiRateLimiter, getCategoryTvs);

export default router;
