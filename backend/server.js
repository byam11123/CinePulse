import express from "express";

import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.route.js";
import movieRoutes from "./routes/movie.route.js";
import tvRoutes from "./routes/tv.route.js";
import searchRoutes from "./routes/search.route.js";
import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middleware/protectRoute.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { generalRateLimiter, apiRateLimiter, authRateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = ENV_VARS.PORT;
const __dirname = path.resolve();

// Logging middleware
app.use(requestLogger);

app.use(express.json());
app.use(cookieParser());

// Apply rate limiting appropriately - these need to be applied before the routes
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/movie", apiRateLimiter, protectRoute, movieRoutes);
app.use("/api/v1/tv", apiRateLimiter, protectRoute, tvRoutes);
app.use("/api/v1/search", apiRateLimiter, protectRoute, searchRoutes);

if (ENV_VARS.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running in ${ENV_VARS.NODE_ENV} mode on port ${PORT}`);
  connectDB();
});
