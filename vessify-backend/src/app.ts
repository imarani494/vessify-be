import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth/auth.js";
import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import { env } from "./lib/env.js";

const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: env.FRONTEND_URL,
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
  })
);
app.use("*", logger());

// Application routes — registered BEFORE the Better Auth wildcard
app.route("/api/auth", authRoutes);
app.route("/api/transactions", transactionRoutes);

// Better Auth handles its own /api/auth/* paths (sessions, providers, etc.)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Global error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, message: "Internal server error" }, 500);
});

// 404
app.notFound((c) => c.json({ success: false, message: "Not found" }, 404));

export default app;
