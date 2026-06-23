"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTransactionSchema = void 0;
const zod_1 = require("zod");
exports.extractTransactionSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, "Transaction text is required"),
});
//# sourceMappingURL=transaction.validator.js.map