import express from "express";
import {
  getMovieDetails,
  getMovieTrailers,
  getTrendingMovie,
  getSimiliarMovies,
  getCategoryMovies,
} from "../../controllers/movie.controller.js";
import { apiRateLimiter } from "../../middleware/rateLimiter.js";
// import { validate, schemas } from "../../middleware/validation.js"; // Temporarily commented out

const router = express.Router();

router.get("/trending", apiRateLimiter, getTrendingMovie);
router.get("/:id/trailers", apiRateLimiter, getMovieTrailers);
router.get("/:id/details", apiRateLimiter, getMovieDetails);
router.get("/:id/similar", apiRateLimiter, getSimiliarMovies);
router.get("/:category", apiRateLimiter, getCategoryMovies);

export default router;
