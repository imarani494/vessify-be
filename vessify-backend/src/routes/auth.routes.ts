import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../auth/auth.js";
import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const authRoutes = new Hono();

/**
 * POST /api/auth/register
 * Creates user, organization, and membership via Better Auth,
 * then auto-creates an organization for the user.
 */
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  // 1. Create the user via Better Auth
  const signUpRes = await auth.api.signUpEmail({
    body: { email, password, name: email.split("@")[0] },
  });

  if (!signUpRes?.user) {
    return c.json({ success: false, message: "Registration failed" }, 400);
  }

  const userId = signUpRes.user.id;

  // 2. Create an organization for the user
  const orgName = `${email.split("@")[0]}'s Organization`;
  const slug = `${email.split("@")[0]}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const org = await prisma.organization.create({
    data: {
      id: crypto.randomUUID(),
      name: orgName,
      slug,
    },
  });

  // 3. Create membership
  await prisma.member.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      organizationId: org.id,
      role: "owner",
    },
  });

  return c.json({
    success: true,
    user: {
      id: signUpRes.user.id,
      email: signUpRes.user.email,
    },
  });
});

/**
 * POST /api/auth/login
 */
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const result = await auth.api.signInEmail({
    body: { email, password },
  });

  if (!result?.user) {
    return c.json({ success: false, message: "Invalid credentials" }, 401);
  }

  // Get JWT token via Better Auth JWT plugin
  const tokenRes = await auth.api.getToken({
    headers: c.req.raw.headers,
  });

  return c.json({
    success: true,
    user: {
      id: result.user.id,
      email: result.user.email,
    },
    token: tokenRes?.token ?? null,
  });
});

export default authRoutes;
