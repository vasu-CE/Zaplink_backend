import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./Routes/index";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.get("/favicon.ico", (req: any, res: any) => res.status(204).end());

// Use Routes
app.get("/health", (req: any, res: any) => res.sendStatus(200));

// Rate limiter for /api, skip favicon and root
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/favicon.ico" || req.path === "/",
});

app.use("/api", apiLimiter);
app.use("/api", routes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
