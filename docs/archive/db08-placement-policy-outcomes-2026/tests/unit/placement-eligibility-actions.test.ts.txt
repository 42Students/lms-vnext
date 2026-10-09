import { describe, expect, it } from "vitest";
import {
  normalizePlacementEligibilityBulkAction,
  placementEligibilityBulkActionSchema,
  placementEligibilityUndoSchema,
} from "@/modules/placements/eligibility-action-validation";

const collegeId = "10000000-0000-4000-8000-000000000001";
const actionId = "20000000-0000-4000-8000-000000000001";
const learnerId = "30000000-0000-4000-8000-000000000001";
const sectionId = "40000000-0000-4000-8000-000000000001";
const cohortId = "50000000-0000-4000-8000-000000000001";

describe("DB08-A eligibility action validation", () => {
  it("canonicalizes scopes and trims reason/note before idempotency comparison", () => {
    const input = normalizePlacementEligibilityBulkAction({
      collegeId,
      actionId,
      changes: [
        {
          scopeType: "SECTION",
          scopeId: sectionId,
          status: "ELIGIBLE",
          reason: "",
          note: "  school decision  ",
        },
        {
          scopeType: "MEMBERSHIP",
          scopeId: learnerId,
          status: "INELIGIBLE",
          reason: "  did not register  ",
        },
      ],
    });
    expect(input.changes).toEqual([
      {
        scopeType: "MEMBERSHIP",
        scopeId: learnerId,
        status: "INELIGIBLE",
        reason: "did not register",
        note: null,
      },
      {
        scopeType: "SECTION",
        scopeId: sectionId,
        status: "ELIGIBLE",
        reason: null,
        note: "school decision",
      },
    ]);
    expect(
      normalizePlacementEligibilityBulkAction({
        ...input,
        changes: [...input.changes].reverse(),
      }),
    ).toEqual(input);
  });

  it("rejects ineligible decisions with an empty or whitespace reason", () => {
    for (const reason of [undefined, null, "", "  "]) {
      expect(() =>
        placementEligibilityBulkActionSchema.parse({
          collegeId,
          actionId,
          changes: [{
            scopeType: "COHORT",
            scopeId: cohortId,
            status: "INELIGIBLE",
            reason,
          }],
        }),
      ).toThrow();
    }
  });

  it("rejects duplicate scopes within one bulk action", () => {
    expect(() =>
      placementEligibilityBulkActionSchema.parse({
        collegeId,
        actionId,
        changes: [
          { scopeType: "COHORT", scopeId: cohortId, status: "ELIGIBLE" },
          { scopeType: "COHORT", scopeId: cohortId, status: "INELIGIBLE", reason: "Blocked" },
        ],
      }),
    ).toThrow();
  });

  it("does not conflate identical UUIDs of different scope types", () => {
    expect(
      placementEligibilityBulkActionSchema.parse({
        collegeId,
        actionId,
        changes: [
          { scopeType: "MEMBERSHIP", scopeId: learnerId, status: "ELIGIBLE" },
          { scopeType: "COHORT", scopeId: learnerId, status: "ELIGIBLE" },
        ],
      }).changes,
    ).toHaveLength(2);
  });

  it("bounds bulk cardinality and decision text", () => {
    expect(() =>
      placementEligibilityBulkActionSchema.parse({
        collegeId,
        actionId,
        changes: [],
      }),
    ).toThrow();
    expect(() =>
      placementEligibilityBulkActionSchema.parse({
        collegeId,
        actionId,
        changes: [{
          scopeType: "COHORT",
          scopeId: cohortId,
          status: "INELIGIBLE",
          reason: "x".repeat(201),
        }],
      }),
    ).toThrow();
    expect(() =>
      placementEligibilityBulkActionSchema.parse({
        collegeId,
        actionId,
        changes: [{
          scopeType: "COHORT",
          scopeId: cohortId,
          status: "ELIGIBLE",
          note: "x".repeat(301),
        }],
      }),
    ).toThrow();
  });

  it("rejects unknown and malformed scopes and invalid action IDs", () => {
    expect(() =>
      placementEligibilityBulkActionSchema.parse({
        collegeId,
        actionId,
        changes: [{
          scopeType: "GLOBAL",
          scopeId: cohortId,
          status: "ELIGIBLE",
        }],
      }),
    ).toThrow();
    expect(() =>
      placementEligibilityUndoSchema.parse({
        collegeId,
        actionId: "not-a-uuid",
      }),
    ).toThrow();
    expect(
      placementEligibilityUndoSchema.parse({ collegeId, actionId }),
    ).toEqual({ collegeId, actionId });
  });
});
