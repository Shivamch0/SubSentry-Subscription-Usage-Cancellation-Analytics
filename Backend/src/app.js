import express from "express";
import cors from "cors";
import customerRoutes from "./routes/customer.routes.js";
import planRoutes from "./routes/plan.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import usageRoutes from "./routes/usage.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  req.cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [
          part.slice(0, index),
          decodeURIComponent(part.slice(index + 1)),
        ];
      }),
  );
  next();
});
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "SubSentry API is healthy" }),
);
app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api/customers", customerRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use(errorHandler);

export default app;
