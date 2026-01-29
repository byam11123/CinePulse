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

// ✅ Fix: Static file serving for Vercel (check if dist exists)
const staticPath = path.join(__dirname, "..", "frontend", "dist");
if (ENV_VARS.NODE_ENV === "production" && fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));

  // Serve frontend for all non-API routes
  app.get(/^(?!\/api\/)/, (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Catch-all for undefined API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) {
    notFoundHandler(req, res, next);
  } else if (ENV_VARS.NODE_ENV !== "production") {
    res.status(404).json({
      success: false,
      message: "Page not found. Frontend is served separately in development.",
    });
  } else {
    // In production without frontend files, return JSON error
    res
      .status(404)
      .json({ success: false, message: "Frontend build not found" });
  }
});

// Global error handler
app.use(globalErrorHandler);

// ✅ Fix: Database & Redis connection singleton for serverless
let isConnected = false;
const connectOnce = async () => {
  if (!isConnected) {
    try {
      await connectDB();

      // Optional: Initialize Redis if available
      try {
        await initializeRedis();
      } catch (redisError) {
        console.log(
          "Redis initialization skipped or failed:",
          redisError.message,
        );
        // Don't fail if Redis isn't available
      }

      isConnected = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  }
};

// ✅ Fix: Connect immediately for serverless cold start
connectOnce();

// ✅ Fix: Only start server locally (Vercel doesn't use app.listen)
if (ENV_VARS.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running in ${ENV_VARS.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
