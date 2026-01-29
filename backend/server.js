import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";

// Import routes (adjust paths as needed)
let authRoutes, movieRoutes, tvRoutes, searchRoutes, healthRoutes;
try {
  const routes = await import("./routes/index.js");
  authRoutes = routes.authRoutes;
  movieRoutes = routes.movieRoutes;
  tvRoutes = routes.tvRoutes;
  searchRoutes = routes.searchRoutes;
  healthRoutes = routes.healthRoutes;
} catch (e) {
  console.error("Routes import error:", e.message);
}

dotenv.config();

const app = express();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// API Routes FIRST
app.get("/api/test", (req, res) => {
  res.json({ message: "API working", timestamp: new Date().toISOString() });
});

if (healthRoutes) app.use("/api/v1/health", healthRoutes);
if (authRoutes) app.use("/api/v1/auth", authRoutes);
if (movieRoutes) app.use("/api/v1/movie", movieRoutes);
if (tvRoutes) app.use("/api/v1/tv", tvRoutes);
if (searchRoutes) app.use("/api/v1/search", searchRoutes);

// Static files - check path
const staticPath = path.join(__dirname, "..", "frontend", "dist");
console.log("Static path:", staticPath, "Exists:", fs.existsSync(staticPath));

if (fs.existsSync(staticPath)) {
  // Serve static files
  app.use(express.static(staticPath));

  // ✅ FIXED: Use app.use instead of app.get("*", ...)
  app.use((req, res, next) => {
    // Skip API routes
    if (req.url.startsWith("/api/")) {
      return next();
    }
    // Serve index.html for everything else (SPA)
    res.sendFile(path.join(staticPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.json({
    status: "API Server Running",
    frontend: "Not found at " + staticPath
  }));
}

// 404 for API routes
app.use((req, res) => {
  if (req.url.startsWith("/api/")) {
    res.status(404).json({ success: false, message: "API endpoint not found" });
  } else {
    res.status(404).send("Not found");
  }
});

// Connect DB
let isConnected = false;
const connectOnce = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("DB Connected");
    } catch (err) {
      console.error("DB Error:", err.message);
    }
  }
};
connectOnce();

// Local dev only
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server on port http://localhost:${PORT}`));
}

export default app;