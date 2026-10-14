import { describe, expect, it } from "vitest";
import {
  projectTpoBranchSeason,
  tpoBranchSeasonCsv,
  tpoBranchSeasonQuerySchema,
} from "@/modules/placements/tpo-branch-season-model";

describe("TPO branch and season persisted-data model", () => {
  const members = [
    { membershipId: "m1", departmentId: "d1", departmentName: "=Engineering" },
    { membershipId: "m2", departmentId: "d1", departmentName: "=Engineering" },
    { membershipId: "m2", departmentId: "d2", departmentName: "Science" },
    { membershipId: "m3", departmentId: "d2", departmentName: "Science" },
  ];
  const applications = [
    { id: "a1", membershipId: "m1" },
    { id: "a2", membershipId: "m1" },
    { id: "a3", membershipId: "m2" },
  ];
  const offers = [
    { id: "o1", applicationId: "a1", status: "ACCEPTED" },
    { id: "o2", applicationId: "a2", status: "ACCEPTED" },
    { id: "o3", applicationId: "a3", status: "ISSUED" },
  ];
  it("counts unique accepted memberships, not offer versions; exposes ambiguous branch", () => {
    const rows = projectTpoBranchSeason(members, applications, offers, null);
    const engineering = rows.find((row) => row.departmentId === "d1");
    expect(engineering).toMatchObject({
      applicants: 1, acceptedLearners: 1, acceptedOfferVersions: 2,
      acceptedPerApplicantPercent: 100,
      registered: null, placedPerRegisteredPercent: null,
    });
    expect(rows.find((row) => row.departmentId === null)?.applicants).toBe(1);
    expect(rows.find((row) => row.departmentId === "d2")?.applicants).toBe(0);
  });
  it("only uses available registered membership choices for placement-pool rates", () => {
    const rows = projectTpoBranchSeason(members, applications, offers, [
      { membershipId: "m1" }, { membershipId: "m3" },
    ]);
    expect(rows.find((row) => row.departmentId === "d1")).toMatchObject({
      registered: 1, registeredPlaced: 1, placedPerRegisteredPercent: 100,
    });
    expect(rows.find((row) => row.departmentId === "d2")).toMatchObject({
      registered: 1, registeredPlaced: 0, placedPerRegisteredPercent: 0,
    });
    expect(rows.find((row) => row.departmentId === null)?.placedPerRegisteredPercent).toBeNull();
  });
  it("neutralizes spreadsheet formulas and does not invent unknown denominators", () => {
    const rows = projectTpoBranchSeason(members, applications, offers, null);
    const csv = tpoBranchSeasonCsv("=Summer", rows);
    expect(csv).toContain("\"'=Summer\"");
    expect(csv).toContain("\"'=Engineering\"");
    expect(csv).toContain('"Accepted applicants / applicants (%)"');
    expect(csv).not.toContain('"Unknown / N/A"');
  });
  it("rejects forged college scopes", () => {
    expect(tpoBranchSeasonQuerySchema.safeParse({ collegeId: "forged" }).success).toBe(false);
    expect(tpoBranchSeasonQuerySchema.safeParse({
      seasonId: "not-an-id",
    }).success).toBe(false);
  });
});
