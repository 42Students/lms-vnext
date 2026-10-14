import { describe, expect, it } from "vitest";
import {
  buildTpoStudentsBulkPayload,
  formatTpoStudentsBulkOutcome,
} from "@/modules/placements/tpo-students-bulk-add-model";

const uuid = (number: number) =>
  "00000000-0000-4000-8000-" + String(number).padStart(12, "0");

describe("TPO Students page bulk-add selection", () => {
  it("uses the exact existing Zod bulk-drive payload and confirms the action", () => {
    const selected = [
      { membershipId: uuid(1), displayName: "Learner A" },
      { membershipId: uuid(2), displayName: "Learner B" },
    ];
    expect(buildTpoStudentsBulkPayload(uuid(3), selected)).toEqual({
      confirmed: true, roleOptionId: uuid(3),
      membershipIds: [uuid(1), uuid(2)],
    });
  });

  it("refuses duplicates and selections beyond the endpoint limit", () => {
    const one = { membershipId: uuid(1), displayName: "One" };
    expect(() => buildTpoStudentsBulkPayload(uuid(2), [one, one])).toThrow();
    expect(() => buildTpoStudentsBulkPayload(uuid(2), [])).toThrow();
    expect(() => buildTpoStudentsBulkPayload(uuid(2),
      Array.from({ length: 201 }, (_, i) => ({
        membershipId: uuid(i + 1), displayName: "Learner " + i,
      })),
    )).toThrow();
  });

  it("uses server denial explanations instead of guessing eligibility", () => {
    expect(formatTpoStudentsBulkOutcome({
      membershipId: uuid(1), status: "ineligible", reason: "Required evidence is missing",
    })).toBe("Required evidence is missing");
    expect(formatTpoStudentsBulkOutcome({
      membershipId: uuid(1), status: "ineligible",
    })).toBe("Not eligible for this drive");
    expect(formatTpoStudentsBulkOutcome({
      membershipId: uuid(1), status: "already-added",
    })).toBe("Already on this drive");
    expect(formatTpoStudentsBulkOutcome({
      membershipId: uuid(1), status: "added",
    })).toBe("Added to drive");
  });
});
