import { prisma } from "../lib/prisma.js";
import { extractTransaction } from "./extraction.service.js";

export async function extractAndSaveTransaction(
  rawText: string,
  userId: string,
  organizationId: string
) {
  const extracted = extractTransaction(rawText);

  const transaction = await prisma.transaction.create({
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

export interface GetTransactionsOptions {
  organizationId: string;
  cursor?: string;
  limit?: number;
}

export async function getTransactions({
  organizationId,
  cursor,
  limit = 10,
}: GetTransactionsOptions) {
  const take = Math.min(limit, 100);

  const transactions = await prisma.transaction.findMany({
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
