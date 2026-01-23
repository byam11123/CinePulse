import express from "express";

import dotenv from "dotenv";
import path from "path";
import { authRoutes, movieRoutes, tvRoutes, searchRoutes, healthRoutes } from "./routes/index.js";
import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middleware/protectRoute.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimiter.js";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initializeRedis } from "./utils/cache.js";
import { apiVersioning, handleDeprecatedVersion } from "./middleware/apiVersioning.js";
import { sanitizeAllInputs } from "./middleware/validation.js";

dotenv.config();

const app = express();
const PORT = ENV_VARS.PORT;
const __dirname = path.resolve();

// Logging middleware
app.use(requestLogger);

// Input sanitization middleware - temporarily disabled due to issues
// app.use(sanitizeAllInputs);

// API versioning middleware
app.use(apiVersioning);
app.use(handleDeprecatedVersion);

app.use(express.json());
app.use(cookieParser());

// Apply rate limiting appropriately - these need to be applied before the routes
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/movie", apiRateLimiter, protectRoute, movieRoutes);
app.use("/api/v1/tv", apiRateLimiter, protectRoute, tvRoutes);
app.use("/api/v1/search", apiRateLimiter, protectRoute, searchRoutes);
app.use("/api/v1/health", healthRoutes);

if (ENV_VARS.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Catch-all route for undefined routes
app.all(/.*/, notFoundHandler);

// Global error handler - this must be the last middleware
app.use(globalErrorHandler);

app.listen(PORT, async () => {
  console.log(`Server running in ${ENV_VARS.NODE_ENV} mode on port ${PORT}`);

  try {
    // Connect to database first
    await connectDB();

    // Initialize Redis cache after DB connection
    await initializeRedis();

    console.log('Database and cache initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database or cache:', error);
    process.exit(1);
  }
});
