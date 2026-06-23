"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const auth_js_1 = require("./auth.js");
const prisma_js_1 = require("../lib/prisma.js");
async function requireAuth(c, next) {
    const session = await auth_js_1.auth.api.getSession({
        headers: c.req.raw.headers,
    });
    if (!session?.user) {
        return c.json({ success: false, message: "Unauthorized" }, 401);
    }
    // Find the user's membership to resolve their organization
    const membership = await prisma_js_1.prisma.member.findFirst({
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
//# sourceMappingURL=middleware.js.map