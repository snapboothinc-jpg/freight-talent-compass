import { describe, expect, it } from "vitest";
import { nominationSchema, readinessClassSchema, categorySchema, aiSettingsSchema, reportSchema } from "@/lib/schemas";
import { aiResponseSchema } from "@/lib/ai/ai.server";

const uuid = () => crypto.randomUUID();

describe("nomination validation", () => {
  const base = { recipient_id: uuid(), category_id: uuid(), message: "Great work on the depot turnaround", idempotencyKey: uuid() };
  it("accepts a valid nomination", () => {
    expect(nominationSchema.safeParse(base).success).toBe(true);
  });
  it("rejects an empty message", () => {
    expect(nominationSchema.safeParse({ ...base, message: " " }).success).toBe(false);
  });
  it("rejects missing idempotency key", () => {
    const { idempotencyKey: _k, ...rest } = base;
    expect(nominationSchema.safeParse(rest).success).toBe(false);
  });
  it("rejects unknown fields", () => {
    expect(nominationSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
  });
});

describe("readiness classes and categories", () => {
  it("readiness class requires code, label and sort order", () => {
    expect(
      readinessClassSchema.safeParse({ id: null, version: null, data: { code: "R1", label: "Ready now", sort_order: 1 } }).success,
    ).toBe(true);
    expect(readinessClassSchema.safeParse({ id: null, version: null, data: { code: "", label: "x", sort_order: 1 } }).success).toBe(false);
  });
  it("category name has a minimum length", () => {
    expect(categorySchema.safeParse({ id: null, version: null, data: { name: "S" } }).success).toBe(false);
    expect(categorySchema.safeParse({ id: null, version: null, data: { name: "Safety" } }).success).toBe(true);
  });
});

describe("AI settings", () => {
  it("only allows the two providers", () => {
    expect(aiSettingsSchema.safeParse({ provider: "lovable", model: "m", version: 1 }).success).toBe(true);
    expect(aiSettingsSchema.safeParse({ provider: "gemini", model: "m", version: 1 }).success).toBe(true);
    expect(aiSettingsSchema.safeParse({ provider: "other", model: "m", version: 1 }).success).toBe(false);
  });
});

describe("AI response validation", () => {
  const item = {
    competency_id: uuid(),
    recommendation_type: "course",
    resource_id: uuid(),
    priority: "high",
    rationale: "Gap of 2 levels in load planning",
    expected_outcome: "Reach level 4",
  };
  it("accepts a well-formed response", () => {
    expect(aiResponseSchema.safeParse({ recommendations: [item] }).success).toBe(true);
  });
  it("rejects recommendations without a rationale (no fabricated output)", () => {
    expect(aiResponseSchema.safeParse({ recommendations: [{ ...item, rationale: "" }] }).success).toBe(false);
  });
  it("rejects unknown fields in items", () => {
    expect(aiResponseSchema.safeParse({ recommendations: [{ ...item, score: 5 }] }).success).toBe(false);
  });
  it("caps responses at 20 recommendations", () => {
    expect(aiResponseSchema.safeParse({ recommendations: Array(21).fill(item) }).success).toBe(false);
  });
});

describe("reports", () => {
  it("only allows the six report kinds", () => {
    for (const kind of ["performance", "gaps", "learning", "training", "recognition", "succession"]) {
      expect(reportSchema.safeParse({ kind }).success).toBe(true);
    }
    expect(reportSchema.safeParse({ kind: "everything" }).success).toBe(false);
  });
});
