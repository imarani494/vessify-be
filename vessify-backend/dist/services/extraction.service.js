"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTransaction = extractTransaction;
/**
 * Parse a currency string like "1,250.00" or "₹18,420.50" into a number.
 */
function parseCurrency(raw) {
    return parseFloat(raw.replace(/[₹,\s]/g, ""));
}
/**
 * Parse a date string into ISO yyyy-mm-dd format.
 * Supports: "11 Dec 2025", "12/11/2025", "2025-12-10"
 */
function parseDate(raw) {
    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw))
        return raw;
    // "11 Dec 2025"
    const written = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(raw.trim());
    if (written) {
        const months = {
            jan: "01", feb: "02", mar: "03", apr: "04",
            may: "05", jun: "06", jul: "07", aug: "08",
            sep: "09", oct: "10", nov: "11", dec: "12",
        };
        const m = months[written[2].toLowerCase()];
        if (m)
            return `${written[3]}-${m}-${written[1].padStart(2, "0")}`;
    }
    // "12/11/2025" → mm/dd/yyyy
    const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
    if (slash) {
        return `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
    }
    return null;
}
/**
 * Sample 1:
 *   Date: 11 Dec 2025
 *   Description: STARBUCKS COFFEE MUMBAI
 *   Amount: -420.00
 *   Balance after transaction: 18,420.50
 */
function trySample1(text) {
    const dateM = /Date:\s*(.+)/i.exec(text);
    const descM = /Description:\s*(.+)/i.exec(text);
    const amtM = /Amount:\s*([₹\-\d,\.]+)/i.exec(text);
    const balM = /Balance after transaction:\s*([₹\d,\.]+)/i.exec(text);
    if (!dateM || !descM || !amtM)
        return null;
    const date = parseDate(dateM[1].trim());
    if (!date)
        return null;
    return {
        date,
        description: descM[1].trim(),
        amount: parseCurrency(amtM[1]),
        balance: balM ? parseCurrency(balM[1]) : null,
        confidence: 1,
    };
}
/**
 * Sample 2:
 *   Uber Ride * Airport Drop
 *   12/11/2025 → ₹1,250.00 debited
 *   Available Balance → ₹17,170.50
 */
function trySample2(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    // Line with date + amount debited
    const txnLine = lines.find((l) => /\d{1,2}\/\d{1,2}\/\d{4}/.test(l) && /debited/i.test(l));
    const balLine = lines.find((l) => /available balance/i.test(l));
    if (!txnLine)
        return null;
    const dateM = /(\d{1,2}\/\d{1,2}\/\d{4})/.exec(txnLine);
    const amtM = /₹([\d,\.]+)\s+debited/i.exec(txnLine);
    if (!dateM || !amtM)
        return null;
    const date = parseDate(dateM[1]);
    if (!date)
        return null;
    // Description is the first line (before the date line)
    const descLine = lines.find((l) => l !== txnLine && !/available balance/i.test(l));
    const balance = balLine
        ? parseCurrency(balLine.split("→")[1] ?? "")
        : null;
    return {
        date,
        description: descLine ?? "Unknown",
        amount: -parseCurrency(amtM[1]),
        balance: balance && !isNaN(balance) ? balance : null,
        confidence: 0.9,
    };
}
/**
 * Sample 3:
 *   txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping
 */
function trySample3(text) {
    // Single-line compact format
    const single = /^\S+\s+(\d{4}-\d{2}-\d{2})\s+(.+?)\s+₹([\d,\.]+)\s+Dr\s+Bal\s+([\d,\.]+)/i.exec(text.trim());
    if (!single)
        return null;
    const date = parseDate(single[1]);
    if (!date)
        return null;
    return {
        date,
        description: single[2].trim(),
        amount: -parseCurrency(single[3]),
        balance: parseCurrency(single[4]),
        confidence: 0.75,
    };
}
function extractTransaction(text) {
    const result = trySample1(text) ??
        trySample2(text) ??
        trySample3(text);
    if (result)
        return result;
    throw new Error("Unable to extract transaction from provided text");
}
//# sourceMappingURL=extraction.service.js.map