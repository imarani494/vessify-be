import type { Context, Next } from "hono";
export interface AuthContext {
    userId: string;
    organizationId: string;
}
declare module "hono" {
    interface ContextVariableMap {
        auth: AuthContext;
    }
}
export declare function requireAuth(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    message: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    message: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=middleware.d.ts.map