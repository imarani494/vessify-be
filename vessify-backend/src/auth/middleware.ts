import type { Context, Next } from "hono";
import { auth } from "./auth.js";
import { prisma } from "../lib/prisma.js";

export interface AuthContext {
  userId: string;
  organizationId: string;
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  // Find the user's membership to resolve their organization
  const membership = await prisma.member.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  if (!membership) {
    return c.json({ success: false, message: "No organization found for user" }, 403);
  }

  c.set("auth", {
    userId: session.user.id,
    organizationId: membership.organizationId,
  });

  await next();
}
