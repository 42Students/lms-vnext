import { describe, expect, it } from "vitest";
import {
  bulkTpoRoundResultSchema,
  summarizeBulkRoundResults,
} from "@/modules/placements/tpo-bulk-round-result-model";

const uuid = (n: number) =>
  "00000000-0000-4000-8000-" + String(n).padStart(12, "0");

describe("confirmed TPO bulk round result staging", () => {
  const entry = {
    expectedCurrentResultId: null,
    result: {
      applicationId: uuid(1),
      outcome: "PASS" as const,
    },
  };

  it("requires confirmation, strict fields, distinct applications and maximum 25", () => {
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [entry],
    }).success).toBe(true);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: false, entries: [entry],
    }).success).toBe(false);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [],
    }).success).toBe(false);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [entry, entry],
    }).success).toBe(false);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true,
      entries: Array.from({ length: 26 }, (_, i) => ({
        ...entry, result: { ...entry.result, applicationId: uuid(i + 1) },
      })),
    }).success).toBe(false);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [entry], collegeId: uuid(2),
    }).success).toBe(false);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [{ ...entry, result: {
        ...entry.result, candidateMessage: "not allowed", unknown: true,
      } }],
    }).success).toBe(false);
  });

  it("requires learner-facing messages for FAIL and ranks for HOLD", () => {
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [{ ...entry, result: {
        ...entry.result, outcome: "FAIL",
      } }],
    }).success).toBe(false);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [{ ...entry, result: {
        ...entry.result, outcome: "FAIL",
        candidateMessage: "Not selected after interview",
      } }],
    }).success).toBe(true);
    expect(bulkTpoRoundResultSchema.safeParse({
      confirmed: true, entries: [{ ...entry, result: {
        ...entry.result, outcome: "HOLD", waitlistRank: 2,
        candidateMessage: "On the waitlist",
      } }],
    }).success).toBe(true);
  });

  it("only counts confirmed staged outcomes as stored", () => {
    expect(summarizeBulkRoundResults([
      { applicationId: uuid(1), status: "staged", resultId: uuid(11) },
      { applicationId: uuid(2), status: "ineligible", reason: "PLACEMENT_RESULT_NOT_FOUND" },
    ])).toEqual({ staged: 1, ineligible: 1 });
  });
});
