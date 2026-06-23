import { z } from "zod";

export const extractTransactionSchema = z.object({
  text: z.string().min(1, "Transaction text is required"),
});

export type ExtractTransactionInput = z.infer<typeof extractTransactionSchema>;
