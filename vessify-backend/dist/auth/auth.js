"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const plugins_1 = require("better-auth/plugins");
const plugins_2 = require("better-auth/plugins");
const prisma_js_1 = require("../lib/prisma.js");
const env_js_1 = require("../lib/env.js");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma_js_1.prisma, {
        provider: "postgresql"
    }),
    secret: env_js_1.env.BETTER_AUTH_SECRET,
    baseURL: env_js_1.env.BETTER_AUTH_URL,
    trustedOrigins: [env_js_1.env.FRONTEND_URL],
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        (0, plugins_1.organization)(),
        (0, plugins_2.jwt)({
            jwt: {
                expirationTime: "7d"
            }
        })
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
                    const org = await prisma_js_1.prisma.organization.create({
                        data: {
                            id: crypto.randomUUID(),
                            name: `${prefix}'s Organization`,
                            slug
                        }
                    });
                    await prisma_js_1.prisma.member.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId: user.id,
                            organizationId: org.id,
                            role: "owner"
                        }
                    });
                }
            }
        }
    }
});
//# sourceMappingURL=auth.js.map