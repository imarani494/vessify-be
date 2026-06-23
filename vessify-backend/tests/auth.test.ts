import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and better-auth before any imports that use them
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    member: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    organization: {
      create: vi.fn(),
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
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      getToken: vi.fn(),
      getSession: vi.fn(),
    },
    handler: vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
  },
}));

import app from "../src/app.js";
import { auth } from "../src/auth/auth.js";
import { prisma } from "../src/lib/prisma.js";

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a new user and creates an organization", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };

    vi.mocked(auth.api.signUpEmail).mockResolvedValue({
      user: mockUser,
      session: {} as never,
      token: "token",
    } as never);

    vi.mocked(prisma.organization.create).mockResolvedValue({
      id: "org-1",
      name: "test's Organization",
      slug: "test-org",
      logo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.member.create).mockResolvedValue({
      id: "member-1",
      userId: "user-1",
      organizationId: "org-1",
      role: "owner",
      createdAt: new Date(),
    });

    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; user: { email: string } };
    expect(body.success).toBe(true);
    expect(body.user.email).toBe("test@example.com");
  });

  it("logs in an existing user", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      session: {} as never,
      token: "token",
    } as never);

    vi.mocked(auth.api.getToken).mockResolvedValue({ token: "jwt-token" } as never);

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; token: string };
    expect(body.success).toBe(true);
    expect(body.token).toBe("jwt-token");
  });
});
