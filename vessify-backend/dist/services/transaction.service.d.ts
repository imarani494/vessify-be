export declare function extractAndSaveTransaction(rawText: string, userId: string, organizationId: string): Promise<any>;
export interface GetTransactionsOptions {
    organizationId: string;
    cursor?: string;
    limit?: number;
}
export declare function getTransactions({ organizationId, cursor, limit, }: GetTransactionsOptions): Promise<{
    data: any;
    nextCursor: any;
}>;
//# sourceMappingURL=transaction.service.d.ts.map