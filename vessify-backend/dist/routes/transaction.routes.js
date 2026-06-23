"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const zod_1 = require("zod");
const middleware_js_1 = require("../auth/middleware.js");
const transaction_service_js_1 = require("../services/transaction.service.js");
const transaction_validator_js_1 = require("../validators/transaction.validator.js");
const transactionRoutes = new hono_1.Hono();
// All transaction routes require authentication
transactionRoutes.use("*", middleware_js_1.requireAuth);
/**
 * POST /api/transactions/extract
 */
transactionRoutes.post("/extract", (0, zod_validator_1.zValidator)("json", transaction_validator_js_1.extractTransactionSchema), async (c) => {
    const { text } = c.req.valid("json");
    const { userId, organizationId } = c.get("auth");
    try {
        const transaction = await (0, transaction_service_js_1.extractAndSaveTransaction)(text, userId, organizationId);
        return c.json({ success: true, data: transaction });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Extraction failed";
        return c.json({ success: false, message }, 422);
    }
});
const paginationSchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
});
/**
 * GET /api/transactions
 */
transactionRoutes.get("/", (0, zod_validator_1.zValidator)("query", paginationSchema), async (c) => {
    const { cursor, limit } = c.req.valid("query");
    const { organizationId } = c.get("auth");
    const result = await (0, transaction_service_js_1.getTransactions)({ organizationId, cursor, limit });
    return c.json({ success: true, ...result });
});
exports.default = transactionRoutes;
//# sourceMappingURL=transaction.routes.js.map