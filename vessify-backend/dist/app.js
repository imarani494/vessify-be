"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const auth_js_1 = require("./auth/auth.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const transaction_routes_js_1 = __importDefault(require("./routes/transaction.routes.js"));
const env_js_1 = require("./lib/env.js");
const app = new hono_1.Hono();
// Middleware
app.use("*", (0, cors_1.cors)({
    origin: env_js_1.env.FRONTEND_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));
app.use("*", (0, logger_1.logger)());
// Application routes — registered BEFORE the Better Auth wildcard
app.route("/api/auth", auth_routes_js_1.default);
app.route("/api/transactions", transaction_routes_js_1.default);
// Better Auth handles its own /api/auth/* paths (sessions, providers, etc.)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth_js_1.auth.handler(c.req.raw));
// Health check
app.get("/health", (c) => c.json({ status: "ok" }));
// Global error handler
app.onError((err, c) => {
    console.error(err);
    return c.json({ success: false, message: "Internal server error" }, 500);
});
// 404
app.notFound((c) => c.json({ success: false, message: "Not found" }, 404));
exports.default = app;
//# sourceMappingURL=app.js.map