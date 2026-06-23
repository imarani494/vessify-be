export interface ExtractedTransaction {
    date: string;
    description: string;
    amount: number;
    balance: number | null;
    confidence: number;
}
export declare function extractTransaction(text: string): ExtractedTransaction;
//# sourceMappingURL=extraction.service.d.ts.map