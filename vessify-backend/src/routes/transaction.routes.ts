import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";
import { extractAndSaveTransaction, getTransactions } from "../services/transaction.service.js";
import { extractTransactionSchema } from "../validators/transaction.validator.js";

const transactionRoutes = new Hono();

// All transaction routes require authentication
transactionRoutes.use("*", requireAuth);

/**
 * POST /api/transactions/extract
 */
transactionRoutes.post(
  "/extract",
  zValidator("json", extractTransactionSchema),
  async (c) => {
    const { text } = c.req.valid("json");
    const { userId, organizationId } = c.get("auth");

    try {
      const transaction = await extractAndSaveTransaction(text, userId, organizationId);
      return c.json({ success: true, data: transaction });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      return c.json({ success: false, message }, 422);
    }
  }
);

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

/**
 * GET /api/transactions
 */
transactionRoutes.get(
  "/",
  zValidator("query", paginationSchema),
  async (c) => {
    const { cursor, limit } = c.req.valid("query");
    const { organizationId } = c.get("auth");

    const result = await getTransactions({ organizationId, cursor, limit });

    return c.json({ success: true, ...result });
  }
);

export default transactionRoutes;
