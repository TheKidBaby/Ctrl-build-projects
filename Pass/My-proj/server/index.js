import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import vaultRoutes from "./routes/vault.js";
import breachRoutes from "./routes/breach.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-user-id",
    "x-confirm-delete",
  ],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Request logging middleware (development only)
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "VaultMaster Server is running",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API Routes
app.use("/api/vault", vaultRoutes);
app.use("/api/breach", breachRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "VaultMaster API",
    version: "1.0.0",
    description: "Encrypted password manager backend with NeDB",
    endpoints: {
      health: "/health",
      vault: "/api/vault",
      docs: "https://github.com/TheKidBaby/Ctrl-build-projects",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   VaultMaster API Server Started   ║
╠════════════════════════════════════╣
║ Port:        ${PORT}                    ║
║ Environment: ${NODE_ENV}           ║
║ CORS Origin: ${corsOptions.origin[0]}  ║
╠════════════════════════════════════╣
║ Health:  http://localhost:${PORT}/health   ║
║ API:     http://localhost:${PORT}/api/vault ║
╚════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

export default app;
