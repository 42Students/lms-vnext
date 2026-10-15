import { describe, expect, it } from "vitest";
import { verifyClassTeamPreview } from "@/modules/projects/class-team-preview-validation";
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const c = "00000000-0000-4000-8000-000000000003";
describe("edited class team preview validation", () => {
  const valid = [{ name: "Team 1", membershipIds: [a,b] }, { name: "Team 2", membershipIds: [c] }];
  it("accepts a complete disjoint preview", () => {
    expect(verifyClassTeamPreview(valid, [a,b,c])).toEqual(valid);
  });
  it("rejects missing learners", () => {
    expect(() => verifyClassTeamPreview([{ name: "Only", membershipIds: [a,b] }], [a,b,c])).toThrow();
  });
  it("rejects forged or out-of-college memberships", () => {
    expect(() => verifyClassTeamPreview(valid, [a,b])).toThrow();
  });
  it("rejects repeat learner and duplicate team names", () => {
    expect(() => verifyClassTeamPreview([{ name: "Team 1", membershipIds: [a,b] }, { name: "team 1", membershipIds: [b,c] }], [a,b,c])).toThrow();
  });
  it("rejects unknown fields and empty teams", () => {
    expect(() => verifyClassTeamPreview([{ name: "x", membershipIds: [a,b,c], collegeId: a }], [a,b,c])).toThrow();
    expect(() => verifyClassTeamPreview([{ name: "x", membershipIds: [] }], [a,b,c])).toThrow();
  });
});
