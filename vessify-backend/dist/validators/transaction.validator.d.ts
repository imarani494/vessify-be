import { z } from "zod";
export declare const extractTransactionSchema: z.ZodObject<{
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export type ExtractTransactionInput = z.infer<typeof extractTransactionSchema>;
//# sourceMappingURL=transaction.validator.d.ts.map