import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { jwt } from "better-auth/plugins";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.FRONTEND_URL],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization(),
    jwt({
      jwt: {
        expirationTime: "7d",
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create an organization and membership for every new user
          const prefix = user.email.split("@")[0] ?? "user";
          const slug = `${prefix}-${Date.now()}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");

          const org = await prisma.organization.create({
            data: {
              id: crypto.randomUUID(),
              name: `${prefix}'s Organization`,
              slug,
            },
          });

          await prisma.member.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              organizationId: org.id,
              role: "owner",
            },
          });
        },
      },
    },
  },
});

export type Auth = typeof auth;
