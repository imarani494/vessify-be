"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1),
    BETTER_AUTH_SECRET: zod_1.z.string().min(1),
    BETTER_AUTH_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(1),
    FRONTEND_URL: zod_1.z.string().url().default("http://localhost:3000"),
    PORT: zod_1.z.coerce.number().default(3001),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map