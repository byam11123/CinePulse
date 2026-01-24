import express from "express";

import dotenv from "dotenv";
import path from "path";
import { authRoutes, movieRoutes, tvRoutes, searchRoutes, healthRoutes } from "./routes/index.js";
import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middleware/protectRoute.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiRateLimiter, authRateLimiter, generalRateLimiter } from "./middleware/rateLimiter.js";
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

// Conditionally apply general rate limiting based on environment
if (ENV_VARS.NODE_ENV === 'production') {
  app.use("/api", generalRateLimiter);
}

app.use(express.json());
app.use(cookieParser());

// Conditionally apply rate limiting based on environment
if (ENV_VARS.NODE_ENV === 'production') {
  // Apply rate limiting in production
  app.use("/api/v1/auth", authRateLimiter, authRoutes);
  app.use("/api/v1/movie", apiRateLimiter, protectRoute, movieRoutes);
  app.use("/api/v1/tv", apiRateLimiter, protectRoute, tvRoutes);
  app.use("/api/v1/search", apiRateLimiter, protectRoute, searchRoutes);
} else {
  // Skip rate limiting in development for easier testing
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/movie", protectRoute, movieRoutes);
  app.use("/api/v1/tv", protectRoute, tvRoutes);
  app.use("/api/v1/search", protectRoute, searchRoutes);
}

app.use("/api/v1/health", healthRoutes);

// Static file serving for production
if (ENV_VARS.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  // Serve frontend for all routes in production (except API)
  app.get(/^(?!\/api\/)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
} else {
  // In development, don't serve frontend files
  // API routes will be handled normally
}

// Catch-all route for undefined API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    notFoundHandler(req, res, next);
  } else {
    // For non-API routes in development, return a simple message
    res.status(404).json({ success: false, message: 'Page not found. Frontend is served separately in development.' });
  }
});

// Global error handler - this must be the last middleware
app.use(globalErrorHandler);

app.listen(PORT, async () => {
  console.log(`Server running in ${ENV_VARS.NODE_ENV} mode on port ${PORT}`);
  console.log('Environment Variables Debug:', {
    NODE_ENV: ENV_VARS.NODE_ENV,
    IS_PROD: ENV_VARS.NODE_ENV === 'production'
  });

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
