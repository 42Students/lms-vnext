import { describe, expect, it } from "vitest";

import {
  buildRecruiterSelfGrantRows,
  type RecruiterSelfGrantFact,
} from "@/modules/placements/recruiter-self-grants-model";

const grants: RecruiterSelfGrantFact[] = [
  {
    id: "grant-b",
    collegeName: "Zeta College",
    grantStatus: "ACTIVE",
    relationshipStatus: "ACTIVE",
    grantedAt: new Date(
      "2026-10-13T20:00:00.000Z",
    ),
  },
  {
    id: "grant-a",
    collegeName: "Alpha College",
    grantStatus: "ACTIVE",
    relationshipStatus: "ACTIVE",
    grantedAt: new Date(
      "2026-09-01T12:00:00.000Z",
    ),
  },
];

describe("Recruiter self college grants", () => {
  it("renders active grants in college-name order", () => {
    const result =
      buildRecruiterSelfGrantRows(grants);

    expect(result.map((grant) => grant.id)).toEqual([
      "grant-a",
      "grant-b",
    ]);
    expect(result.every(
      (grant) =>
        grant.grantStatus === "ACTIVE" &&
        grant.relationshipStatus === "ACTIVE",
    )).toBe(true);
  });

  it("formats grant dates in IST", () => {
    const result =
      buildRecruiterSelfGrantRows(grants);

    expect(
      result.find(
        (grant) => grant.id === "grant-b",
      ),
    ).toMatchObject({
      grantedAtLabel: "14 Oct 2026",
      grantedAtIso:
        "2026-10-13T20:00:00.000Z",
    });
  });

  it("does not represent revoked grants as current access", () => {
    const result =
      buildRecruiterSelfGrantRows([
        ...grants,
        {
          ...grants[0],
          id: "revoked",
          grantStatus: "REVOKED",
        },
      ]);

    expect(
      result.some(
        (grant) => grant.id === "revoked",
      ),
    ).toBe(false);
  });

  it("excludes archived company relationships", () => {
    const result =
      buildRecruiterSelfGrantRows([
        {
          ...grants[0],
          relationshipStatus: "ARCHIVED",
        },
      ]);

    expect(result).toEqual([]);
  });

  it("does not infer grants when none are active", () => {
    expect(
      buildRecruiterSelfGrantRows([]),
    ).toEqual([]);
  });

  it("does not mutate the input", () => {
    const original = grants.map(
      (grant) => ({ ...grant }),
    );

    buildRecruiterSelfGrantRows(grants);

    expect(grants).toEqual(original);
  });

  it("does not project another person's contact fields", () => {
    const result =
      buildRecruiterSelfGrantRows(grants);

    for (const grant of result) {
      expect(grant).not.toHaveProperty("email");
      expect(grant).not.toHaveProperty("phone");
      expect(grant).not.toHaveProperty("grantedByUserId");
      expect(grant).not.toHaveProperty("recruiterUserId");
    }
  });

  it("retains college code only when the authorized fact supplies it",()=>{
    const row=buildRecruiterSelfGrantRows([{
      id:"grant",collegeName:"College A",collegeCode:"COL-A",grantStatus:"ACTIVE",
      relationshipStatus:"ACTIVE",grantedAt:new Date("2026-10-15T00:00:00Z"),
    }]);
    expect(row[0]?.collegeCode).toBe("COL-A");
  });
});
