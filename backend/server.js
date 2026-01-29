import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  authRoutes,
  movieRoutes,
  tvRoutes,
  searchRoutes,
  healthRoutes,
} from "./routes/index.js";
import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middleware/protectRoute.js";
import { requestLogger } from "./middleware/requestLogger.js";
import {
  apiRateLimiter,
  authRateLimiter,
  generalRateLimiter,
} from "./middleware/rateLimiter.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { initializeRedis } from "./utils/cache.js";
import {
  apiVersioning,
  handleDeprecatedVersion,
} from "./middleware/apiVersioning.js";

dotenv.config();

const app = express();

// ✅ Fix: Define PORT
const PORT = ENV_VARS.PORT || 5000;

// ✅ Fix: Proper __dirname for ES modules on Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging middleware
app.use(requestLogger);

// API versioning middleware
app.use(apiVersioning);
app.use(handleDeprecatedVersion);

// Conditionally apply general rate limiting based on environment
if (ENV_VARS.NODE_ENV === "production") {
  app.use("/api", generalRateLimiter);
}

app.use(express.json());
app.use(cookieParser());

// Conditionally apply rate limiting based on environment
if (ENV_VARS.NODE_ENV === "production") {
  app.use("/api/v1/auth", authRateLimiter, authRoutes);
  app.use("/api/v1/movie", apiRateLimiter, protectRoute, movieRoutes);
  app.use("/api/v1/tv", apiRateLimiter, protectRoute, tvRoutes);
  app.use("/api/v1/search", apiRateLimiter, protectRoute, searchRoutes);
} else {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/movie", protectRoute, movieRoutes);
  app.use("/api/v1/tv", protectRoute, tvRoutes);
  app.use("/api/v1/search", protectRoute, searchRoutes);
}

app.use("/api/v1/health", healthRoutes);

// ✅ Fix: Static file serving - MOVED BEFORE error handlers
const staticPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(staticPath)) {
  // Serve static files
  app.use(express.static(staticPath));

  // Serve index.html for all non-API routes (SPA support)
  app.get("*", (req, res, next) => {
    if (req.url.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Catch-all for undefined API routes
app.use((req, res, next) => {
  if (req.url.startsWith("/api/")) {
    notFoundHandler(req, res, next);
  } else {
    next();
  }
});

// Global error handler
app.use(globalErrorHandler);

// ✅ Fix: Simplified DB connection - don't block requests
let isConnected = false;
const connectDBOnce = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      console.log("MongoDB Connected");

      // Optional: Initialize Redis
      try {
        await initializeRedis();
        console.log("Redis Connected");
      } catch (redisError) {
        console.log("Redis skipped:", redisError.message);
      }

      isConnected = true;
    } catch (error) {
      console.error("DB Connection Error:", error);
      isConnected = false;
    }
  }
};

// Start DB connection in background (don't wait)
connectDBOnce();

// ✅ Fix: Export for Vercel
export default app;

// ✅ Fix: Only listen locally
if (ENV_VARS.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}