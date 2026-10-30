import { describe, expect, it } from "vitest";
import { computeGap, weightTotal, canActivateProfile, computeScore } from "@/lib/rules";
import { canTransition, EVALUATION_TRANSITIONS, ASSESSMENT_TRANSITIONS } from "@/lib/policy";
import { mapDbError } from "@/lib/api/result";

describe("gap calculation", () => {
  it("gap = max(0, required - current)", () => {
    expect(computeGap(4, 2)).toEqual({ gap: 2, status: "gap" });
  });
  it("never negative when current exceeds required", () => {
    expect(computeGap(3, 5)).toEqual({ gap: 0, status: "met" });
  });
  it("not assessed is distinct and never level 0", () => {
    expect(computeGap(3, null)).toEqual({ gap: null, status: "not_assessed" });
    expect(computeGap(3, null).status).not.toBe(computeGap(3, 0).status === "gap" ? "not_assessed" : "x");
  });
});

describe("profile weights", () => {
  it("activation requires exactly 100 percent", () => {
    expect(canActivateProfile([{ item_type: "rating", weight: 60 }, { item_type: "kpi", weight: 30 }]).ok).toBe(false);
    expect(canActivateProfile([{ item_type: "rating", weight: 70 }, { item_type: "kpi", weight: 30 }]).ok).toBe(true);
  });
  it("rejects an empty profile", () => {
    expect(canActivateProfile([]).ok).toBe(false);
  });
  it("totals decimals precisely", () => {
    expect(weightTotal([{ item_type: "rating", weight: 33.33 }, { item_type: "rating", weight: 33.33 }, { item_type: "rating", weight: 33.34 }])).toBe(100);
  });
});

describe("scoring", () => {
  const items = [
    { id: "a", item_type: "rating", weight: 50 },
    { id: "b", item_type: "kpi", weight: 50, kpi_target: 95 },
    { id: "c", item_type: "long_text", weight: 0 },
  ];
  it("weights ratings by scale and KPIs by target, capped at 100%", () => {
    expect(computeScore(items, [{ item_id: "a", rating: 4 }, { item_id: "b", kpi_actual: 120 }], 5)).toBe(90);
  });
  it("unanswered items score 0", () => {
    expect(computeScore(items, [], 5)).toBe(0);
  });
});

describe("state machines", () => {
  it("an approved evaluation can only be reopened", () => {
    expect(canTransition(EVALUATION_TRANSITIONS, "approved", "reopened")).toBe(true);
    expect(canTransition(EVALUATION_TRANSITIONS, "approved", "in_progress")).toBe(false);
  });
  it("a draft evaluation cannot jump to approved", () => {
    expect(canTransition(EVALUATION_TRANSITIONS, "in_progress", "approved")).toBe(false);
  });
  it("approved assessments are final", () => {
    expect(ASSESSMENT_TRANSITIONS.approved).toEqual([]);
  });
});

describe("error mapping", () => {
  it("NOT_FOUND never leaks detail", () => {
    expect(mapDbError("NOT_FOUND: secret employee", "r").message).toBe("The record was not found.");
  });
  it("maps conflicts and rule violations", () => {
    expect(mapDbError("CONFLICT: changed", "r").code).toBe("CONFLICT");
    expect(mapDbError("RULE: item weights must total 100 percent (currently 90)", "r").code).toBe("RULE");
  });
  it("unknown errors are generic", () => {
    const e = mapDbError("relation foo does not exist at line 3", "r");
    expect(e.code).toBe("SERVER_ERROR");
    expect(e.message).not.toContain("relation");
  });
});
