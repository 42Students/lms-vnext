import { describe, expect, it } from "vitest";
import { projectTpoPlacedStudentsByBranch, tpoPlacedBranchCsv, TPO_PLACED_BRANCH_CSV_LIMIT } from "@/modules/placements/tpo-placed-branch-model";
describe("placed students by season and branch", () => {
  it("deduplicates accepted learners and only confirms explicit JOINED outcomes", () => {
    const result = projectTpoPlacedStudentsByBranch([
      { id: "a1", membershipId: "m1", status: "ACCEPTED", joiningStatus: "JOINED" },
      { id: "a2", membershipId: "m1", status: "ACCEPTED", joiningStatus: null },
      { id: "a3", membershipId: "m2", status: "ACCEPTED", joiningStatus: "PENDING" },
      { id: "a4", membershipId: "m3", status: "WITHDRAWN", joiningStatus: "JOINED" },
      { id: "a2", membershipId: "m1", status: "ACCEPTED", joiningStatus: null },
    ], [{ membershipId: "m1", departmentId: "b1", departmentName: "Engineering" }]);
    expect(result.totals).toEqual({ placed: 2, joined: 1, acceptedOfferVersions: 3 });
    expect(result.rows).toHaveLength(2);
    expect(result.rows.find((r) => r.departmentId === "b1")).toMatchObject({ placed: 1, joined: 1 });
    expect(result.rows.find((r) => r.departmentId === null)).toMatchObject({ placed: 1, joined: 0 });
  });
  it("exports full totals, neutralizes formulas and caps branch rows with notice", () => {
    const many = Array.from({ length: TPO_PLACED_BRANCH_CSV_LIMIT + 1 }, (_, i) => ({
      departmentId: String(i), departmentName: i === 0 ? "=SUM(1+1)" : "Branch " + i,
      placed: 1, joined: 0, acceptedOfferVersions: 1,
    }));
    const csv = tpoPlacedBranchCsv("-Season", {
      totals: { placed: 201, joined: 0, acceptedOfferVersions: 201 }, rows: many,
    });
    expect(csv.truncated).toBe(true);
    expect(csv.csv).toContain("TRUNCATED");
    expect(csv.csv).toContain("'=SUM(1+1)");
    expect(csv.csv).toContain("'-Season");
    expect(csv.csv).toContain("201");
  });
});
