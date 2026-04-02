import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import authRouter from "./routes/auth";
import equipmentRouter from "./routes/equipment";
import sensorsRouter from "./routes/sensors";
import alertsRouter from "./routes/alerts";
import inspectionsRouter from "./routes/inspections";
import workordersRouter from "./routes/workorders";
import usersRouter from "./routes/users";
import dashboardRouter from "./routes/dashboard";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// 1. Explicit CORS (Replace the "*" with your S3 URL)
app.use(cors({ 
  origin: [
    "http://rig-guard-ui-ct-2026.s3-website.us-east-2.amazonaws.com", // Added comma
    "http://rig-guard-test-ui-2026.s3-website.us-east-2.amazonaws.com", // Added comma
    "http://localhost:5173" 
  ], 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], 
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true 
}));

app.use(morgan("combined"));
app.use(express.json());

// 2. The "AWS Life Saver" Route
// This ensures ECS sees a 200 OK when it pings the root
app.get("/", (_req, res) => res.status(200).send("RigGuard API Root - Healthy"));

// Keep your existing /health route too
app.get("/health", (_req, res) => res.json({ status: "ok", service: "rigguard-api", timestamp: new Date().toISOString() }));

// ... rest of your routes
app.use("/api/auth", authRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/sensors", sensorsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/inspections", inspectionsRouter);
app.use("/api/work-orders", workordersRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

async function main() {
  await connectDB();
  app.listen(PORT, () => console.log(`RigGuard API listening on port ${PORT}`));
}
main().catch(err => { console.error(err); process.exit(1); });
