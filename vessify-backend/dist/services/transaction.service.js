"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAndSaveTransaction = extractAndSaveTransaction;
exports.getTransactions = getTransactions;
const prisma_js_1 = require("../lib/prisma.js");
const extraction_service_js_1 = require("./extraction.service.js");
async function extractAndSaveTransaction(rawText, userId, organizationId) {
    const extracted = (0, extraction_service_js_1.extractTransaction)(rawText);
    const transaction = await prisma_js_1.prisma.transaction.create({
        data: {
            userId,
            organizationId,
            rawText,
            date: new Date(extracted.date),
            description: extracted.description,
            amount: extracted.amount,
            balance: extracted.balance,
            confidence: extracted.confidence,
        },
    });
    return transaction;
}
async function getTransactions({ organizationId, cursor, limit = 10, }) {
    const take = Math.min(limit, 100);
    const transactions = await prisma_js_1.prisma.transaction.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(cursor
            ? {
                cursor: { id: cursor },
                skip: 1,
            }
            : {}),
    });
    const hasMore = transactions.length > take;
    const data = hasMore ? transactions.slice(0, take) : transactions;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;
    return { data, nextCursor: nextCursor ?? null };
}
//# sourceMappingURL=transaction.service.js.map