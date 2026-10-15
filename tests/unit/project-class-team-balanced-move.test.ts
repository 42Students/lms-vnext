import { describe, it, expect } from "vitest";
import { moveMemberBalanced } from "@/modules/projects/class-team-balanced-move";

const teams = [
  { name: "A", membershipIds: ["a", "b", "c"] },
  { name: "B", membershipIds: ["d", "e"] },
];
describe("balanced manual team assignments", () => {
  it("moves from the larger team to the smaller team", () => {
    expect(moveMemberBalanced(teams, "a", 1).map(t => t.membershipIds.length)).toEqual([2, 3]);
  });
  it("rejects a move that would leave a two-student size gap", () => {
    expect(() => moveMemberBalanced(teams, "d", 0)).toThrow("TEAM_SIZE_IMBALANCE");
  });
  it("leaves the original preview immutable", () => {
    moveMemberBalanced(teams, "a", 1);
    expect(teams[0].membershipIds).toContain("a");
  });
  it("rejects unknown and duplicate student memberships", () => {
    expect(() => moveMemberBalanced(teams, "not-in-roster", 1)).toThrow();
    expect(() => moveMemberBalanced([{name:"A",membershipIds:["a"]},{name:"B",membershipIds:["a"]}],"a",1)).toThrow();
  });
});
