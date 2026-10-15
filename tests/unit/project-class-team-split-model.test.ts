import { describe, expect, it } from "vitest";
import { movePreviewMember, previewClassTeams } from "@/modules/projects/class-team-split-model";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const students = Array.from({ length: 17 }, (_, i) => ({
  membershipId: id(i + 1), rollNumber: String(17 - i),
}));

describe("class team split preview", () => {
  it("balances nondivisible class sizes by at most one", () => {
    const teams = previewClassTeams({ mode: "TEAMS", students, teamSize: 5 });
    expect(teams.map(team => team.membershipIds.length)).toEqual([5, 4, 4, 4]);
    expect(new Set(teams.flatMap(team => team.membershipIds)).size).toBe(17);
  });
  it("is deterministic for a seed regardless of input row order", () => {
    const input = { mode: "TEAMS" as const, teamSize: 5, order: "SHUFFLE" as const, seed: "batch-42", students };
    expect(previewClassTeams(input)).toEqual(previewClassTeams({ ...input, students: [...students].reverse() }));
    expect(previewClassTeams({ ...input, seed: "batch-43" })).not.toEqual(previewClassTeams(input));
  });
  it("orders roll numbers naturally", () => {
    const teams = previewClassTeams({ mode: "TEAMS", teamSize: 2, students });
    expect(teams[0].membershipIds).toEqual([id(17), id(16)]);
  });
  it("groups the entire class without splitting", () => {
    expect(previewClassTeams({ mode: "WHOLE_CLASS", students })).toHaveLength(1);
    expect(previewClassTeams({ mode: "WHOLE_CLASS", students })[0].membershipIds).toHaveLength(17);
  });
  it("supports manual preview movement preserving unique memberships", () => {
    const groups = previewClassTeams({ mode: "TEAMS", students, teamSize: 5 });
    const chosen = groups[0].membershipIds[0];
    const edited = movePreviewMember(groups, chosen, 1);
    expect(groups[0].membershipIds).toContain(chosen);
    expect(edited[0].membershipIds).not.toContain(chosen);
    expect(edited[1].membershipIds).toContain(chosen);
    expect(new Set(edited.flatMap(team => team.membershipIds)).size).toBe(17);
    expect(() => movePreviewMember(groups, chosen, 100)).toThrow();
  });
  it("refuses duplicate student membership IDs", () => {
    expect(() => previewClassTeams({ mode: "TEAMS", students: [students[0], students[0]] })).toThrow();
  });
});
