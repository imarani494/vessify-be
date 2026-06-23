import { describe, it, expect } from "vitest";
import { extractTransaction } from "../src/services/extraction.service.js";

describe("Extraction Service", () => {
  it("parses Sample 1 correctly", () => {
    const text = `Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50`;

    const result = extractTransaction(text);

    expect(result.date).toBe("2025-12-11");
    expect(result.description).toBe("STARBUCKS COFFEE MUMBAI");
    expect(result.amount).toBe(-420);
    expect(result.balance).toBe(18420.5);
    expect(result.confidence).toBe(1);
  });

  it("parses Sample 2 correctly", () => {
    const text = `Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50`;

    const result = extractTransaction(text);

    expect(result.date).toBe("2025-12-11");
    expect(result.amount).toBe(-1250);
    expect(result.balance).toBe(17170.5);
    expect(result.confidence).toBe(0.9);
  });

  it("parses Sample 3 correctly", () => {
    const text =
      "txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping";

    const result = extractTransaction(text);

    expect(result.date).toBe("2025-12-10");
    expect(result.amount).toBe(-2999);
    expect(result.balance).toBe(14171.5);
    expect(result.confidence).toBe(0.75);
  });

  it("throws on unrecognized text", () => {
    expect(() => extractTransaction("random gibberish text")).toThrow();
  });
});
