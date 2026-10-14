import { describe, expect, it } from "vitest";
import {
  bulkDriveAddSchema,
  bulkDriveCandidatesQuerySchema,
  bulkDriveCounts,
  bulkDriveOutcome,
} from "@/modules/placements/bulk-drive-model";

const uuid = (index: number) =>
  "00000000-0000-4000-8000-" + String(index).padStart(12, "0");

describe("TPO bulk Add-to-Drive input and outcomes", () => {
  it("requires explicit confirmation and refuses more than 200 learners", () => {
    const valid = {
      roleOptionId: uuid(1), membershipIds: [uuid(2)], confirmed: true,
    };
    expect(bulkDriveAddSchema.safeParse(valid).success).toBe(true);
    expect(bulkDriveAddSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
    expect(bulkDriveAddSchema.safeParse({ ...valid, membershipIds: [] }).success).toBe(false);
    expect(bulkDriveAddSchema.safeParse({
      ...valid, membershipIds: Array.from({ length: 201 }, (_, i) => uuid(i + 1)),
    }).success).toBe(false);
  });
  it("rejects duplicate, forged and extra-field learner selections", () => {
    const valid = {
      roleOptionId: uuid(1), membershipIds: [uuid(2)], confirmed: true,
    };
    expect(bulkDriveAddSchema.safeParse({
      ...valid, membershipIds: [uuid(2), uuid(2)],
    }).success).toBe(false);
    expect(bulkDriveAddSchema.safeParse({
      ...valid, membershipIds: ["other-college"],
    }).success).toBe(false);
    expect(bulkDriveAddSchema.safeParse({
      ...valid, collegeId: uuid(3),
    }).success).toBe(false);
  });
  it("classifies persisted active, withdrawn and ineligible learners", () => {
    expect(bulkDriveOutcome(uuid(1), { eligible: true }).status).toBe("added");
    expect(bulkDriveOutcome(uuid(1), {
      eligible: false, existingStatus: "SUBMITTED",
    }).status).toBe("already-added");
    expect(bulkDriveOutcome(uuid(1), {
      eligible: true, existingStatus: "WITHDRAWN",
    }).status).toBe("ineligible");
    expect(bulkDriveOutcome(uuid(1), { eligible: false }).status).toBe("ineligible");
  });
  it("preserves per-learner totals", () => {
    expect(bulkDriveCounts([
      bulkDriveOutcome(uuid(1), { eligible: true }),
      bulkDriveOutcome(uuid(2), { eligible: false }),
      bulkDriveOutcome(uuid(3), {
        eligible: false, existingStatus: "SUBMITTED",
      }),
    ])).toEqual({ added: 1, ineligible: 1, alreadyAdded: 1 });
  });
  it("bounds candidate browsing and forbids extra query identifiers", () => {
    expect(bulkDriveCandidatesQuerySchema.parse({
      page: "3", search: " Ada ",
    })).toEqual({ page: 3, search: "Ada" });
    expect(bulkDriveCandidatesQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(bulkDriveCandidatesQuerySchema.safeParse({
      collegeId: uuid(4),
    }).success).toBe(false);
  });
});
