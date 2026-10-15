import { describe, expect, it } from "vitest";
import { planClassTeamWorkspaceNames } from "@/modules/projects/class-team-workspace-names";
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
describe("class team workspace names", () => {
  it("generates stable noncolliding slugs", () => {
    const result = planClassTeamWorkspaceNames("Capstone", "capstone", [
      { name: "Team 1", membershipIds: [a] },
      { name: "Team 2", membershipIds: [b] },
    ]);
    expect(result.map(x => x.slug)).toEqual(["capstone-team-1", "capstone-team-2"]);
    expect(result[0].title).toBe("Capstone · Team 1");
  });
  it("refuses empty groups or invalid base slugs", () => {
    expect(() => planClassTeamWorkspaceNames("Capstone", "bad slug", [{ name: "A", membershipIds: [a] }])).toThrow();
    expect(() => planClassTeamWorkspaceNames("Capstone", "valid", [{ name: "A", membershipIds: [] }])).toThrow();
  });
  it("pads team suffixes for stable lexical sorting", () => {
    const teams = Array.from({ length: 12 }, (_, index) => ({ name: String(index + 1), membershipIds: ["00000000-0000-4000-8000-0000000001" + String(index).padStart(2, "0")] }));
    const result = planClassTeamWorkspaceNames("Capstone", "capstone", teams);
    expect(result[0].slug).toBe("capstone-team-01");
    expect(result[11].slug).toBe("capstone-team-12");
  });
});
