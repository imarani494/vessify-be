"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_server_1 = require("@hono/node-server");
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./lib/env.js");
(0, node_server_1.serve)({
    fetch: app_js_1.default.fetch,
    port: env_js_1.env.PORT,
}, () => {
    console.log(`🚀 Server running at http://localhost:${env_js_1.env.PORT}`);
});
//# sourceMappingURL=index.js.map