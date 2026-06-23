import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../src/lib/env.js", () => ({
  env: {
    DATABASE_URL: "postgresql://localhost/test",
    BETTER_AUTH_SECRET: "test-secret-32-chars-long-enough!!",
    BETTER_AUTH_URL: "http://localhost:3001",
    JWT_SECRET: "test-jwt-secret",
    FRONTEND_URL: "http://localhost:3000",
    PORT: 3001,
  },
}));

vi.mock("../src/auth/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

import { getTransactions } from "../src/services/transaction.service.js";
import { prisma } from "../src/lib/prisma.js";

describe("Organization Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only returns transactions for the requesting organization", async () => {
    const orgATransactions = [
      { id: "txn-1", organizationId: "org-a", description: "Org A purchase" },
    ];

    vi.mocked(prisma.transaction.findMany).mockResolvedValue(
      orgATransactions as never
    );

    const result = await getTransactions({ organizationId: "org-a" });

    // Verify the query was called with org-a's ID
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-a" }),
      })
    );

    // All returned transactions belong to org-a only
    for (const txn of result.data) {
      expect((txn as { organizationId: string }).organizationId).toBe("org-a");
    }
  });

  it("User A cannot see User B transactions (different organizations)", async () => {
    // Simulate User B's transactions in the DB
    const orgBTransactions = [
      { id: "txn-99", organizationId: "org-b", description: "Org B purchase" },
    ];

    // When queried with org-a, DB returns empty (org filtering works)
    vi.mocked(prisma.transaction.findMany).mockImplementation(
      async (args: unknown) => {
        const query = args as { where?: { organizationId?: string } };
        if (query?.where?.organizationId === "org-a") return [];
        return orgBTransactions as never;
      }
    );

    const result = await getTransactions({ organizationId: "org-a" });

    expect(result.data).toHaveLength(0);
    expect(result.data.find(
      (t) => (t as { organizationId: string }).organizationId === "org-b"
    )).toBeUndefined();
  });
});
