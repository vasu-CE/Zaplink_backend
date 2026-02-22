import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./Routes/index";
import cookieParser from "cookie-parser";
import { globalLimiter } from "./middlewares/rateLimiter";
import multer from "multer";

dotenv.config();

const app = express();

app.set("trust proxy", 1);


app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ── Utility Routes (excluded from rate limiting) ─────────────────────────────
app.get("/favicon.ico", (req: any, res: any) => res.status(204).end());
app.get("/", (req: any, res: any) => res.status(200).send("ZapLink API Root"));
app.get("/health", (req: any, res: any) => res.status(200).send("OK"));

// ── Global Rate Limiter ───────────────────────────────────────────────────────
// Applied to all routes below. Sensitive routes (/upload, /:shortId) get
// additional, stricter limiters applied directly in zap.routes.ts.
// Defaults: 100 requests per 15 minutes per IP (configurable via .env).
app.use(globalLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api", routes);

// ── Global Error Handler ─────────────────────────────────────────────────────
// Catches Multer file-size errors and returns a clear 400 JSON response
app.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed size is 50 MB.",
        error: err.code,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.code,
    });
  }
  next(err);
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
