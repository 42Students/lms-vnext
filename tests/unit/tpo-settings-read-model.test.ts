import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTpoTeamRoster,
  buildTpoTrustedCompanies,
  buildTpoTrustedDomains,
  summarizeTpoTeam,
  type TpoTeamEvidenceRow,
} from "@/modules/placements/tpo-settings-read-model";

describe("TPO Placement Team read model", () => {
  const base = {
    membershipStatus: "ACTIVE",
    platformStatus: "ACTIVE",
  };

  it("deduplicates TPO and explicit TPO Admin evidence", () => {
    const rows: TpoTeamEvidenceRow[] = [
      {
        ...base,
        membershipId: "member-a",
        displayName: "Asha",
        role: "TPO",
      },
      {
        ...base,
        membershipId: "member-a",
        displayName: "Asha",
        role: "TPO_ADMIN",
      },
      {
        ...base,
        membershipId: "member-a",
        displayName: "Asha",
        role: "TPO",
      },
    ];

    const members = buildTpoTeamRoster(rows);

    expect(members).toHaveLength(1);
    expect(members[0].roles).toEqual([
      "TPO_ADMIN",
      "TPO",
    ]);

    expect(summarizeTpoTeam(members)).toMatchObject({
      total: 1,
      tpoMemberships: 1,
      tpoAdmins: 1,
      facultyCoordinators: 0,
      studentCoordinators: 0,
    });
  });

  it("keeps explicit faculty coordinator evidence separate from TPO membership", () => {
    const members = buildTpoTeamRoster([
      {
        ...base,
        membershipId: "faculty-1",
        displayName: "Faculty Member",
        role: "FACULTY_COORDINATOR",
      },
      {
        ...base,
        membershipId: "tpo-1",
        displayName: "TPO Member",
        role: "TPO",
      },
    ]);

    expect(members).toHaveLength(2);

    expect(
      members.find((member) => member.membershipId === "faculty-1")
        ?.roles,
    ).toEqual(["FACULTY_COORDINATOR"]);

    expect(summarizeTpoTeam(members)).toMatchObject({
      tpoMemberships: 1,
      facultyCoordinators: 1,
      tpoAdmins: 0,
    });
  });

  it("excludes suspended memberships and disabled platform users", () => {
    const members = buildTpoTeamRoster([
      {
        ...base,
        membershipId: "member-valid",
        displayName: "Valid Member",
        role: "TPO",
      },
      {
        ...base,
        membershipId: "member-suspended",
        displayName: "Suspended Member",
        membershipStatus: "SUSPENDED",
        role: "TPO",
      },
      {
        ...base,
        membershipId: "member-disabled",
        displayName: "Disabled Member",
        platformStatus: "DISABLED",
        role: "TPO",
      },
    ]);

    expect(members.map((member) => member.membershipId))
      .toEqual(["member-valid"]);
  });

  it("retains dated student duties without duplicating a drive/date assignment", () => {
    const evidence: TpoTeamEvidenceRow[] = [
      {
        ...base,
        membershipId: "student-1",
        displayName: "Student Coordinator",
        role: "STUDENT_COORDINATOR",
        jobId: "job-1",
        jobTitle: "Engineering Drive",
        onDate: "2026-10-14",
      },
      {
        ...base,
        membershipId: "student-1",
        displayName: "Student Coordinator",
        role: "STUDENT_COORDINATOR",
        jobId: "job-1",
        jobTitle: "Engineering Drive",
        onDate: "2026-10-14",
      },
      {
        ...base,
        membershipId: "student-1",
        displayName: "Student Coordinator",
        role: "STUDENT_COORDINATOR",
        jobId: "job-1",
        jobTitle: "Engineering Drive",
        onDate: "2026-10-15",
      },
    ];

    const members = buildTpoTeamRoster(evidence);

    expect(members).toHaveLength(1);
    expect(members[0].roles).toEqual(["STUDENT_COORDINATOR"]);
    expect(members[0].studentDuties).toEqual([
      {
        jobId: "job-1",
        jobTitle: "Engineering Drive",
        onDate: "2026-10-15",
      },
      {
        jobId: "job-1",
        jobTitle: "Engineering Drive",
        onDate: "2026-10-14",
      },
    ]);

    expect(summarizeTpoTeam(members)).toMatchObject({
      studentCoordinators: 1,
      studentDutyAssignments: 2,
    });
  });

  it("does not add names, email addresses or phone numbers from unknown fields", () => {
    const member = buildTpoTeamRoster([
      {
        ...base,
        membershipId: "member-a",
        displayName: null,
        role: "TPO",
      },
    ])[0];

    expect(member.displayName).toBe("Unnamed member");
    expect(member).not.toHaveProperty("email");
    expect(member).not.toHaveProperty("phone");
  });
});

describe("TPO Trusted Companies read model", () => {
  const companies = [
    {
      companyId: "company-b",
      relationshipId: "relationship-b",
      name: "Beta Company",
      primaryDomain: "beta.example",
      isTrusted: false,
    },
    {
      companyId: "company-a",
      relationshipId: "relationship-a",
      name: "Alpha Company",
      primaryDomain: "alpha.example",
      isTrusted: true,
    },
  ];

  it("sorts companies and counts college relationship trust flags", () => {
    const result = buildTpoTrustedCompanies(companies);

    expect(result.total).toBe(2);
    expect(result.trusted).toBe(1);
    expect(result.notTrusted).toBe(1);

    expect(result.companies.map((row) => row.name)).toEqual([
      "Alpha Company",
      "Beta Company",
    ]);
  });

  it("does not infer trusted domains from global company primary domains", () => {
    const result = buildTpoTrustedCompanies(companies);
    const domains = buildTpoTrustedDomains([]);

    expect(result.companies[0].primaryDomain).toBe(
      "alpha.example",
    );
    expect(domains).toEqual([]);
  });

  it("sorts and deduplicates persisted explicit-domain evidence", () => {
    const domains = buildTpoTrustedDomains([
      {
        domain: "example.org",
        createdAt: new Date("2026-10-12T00:00:00.000Z"),
      },
      {
        domain: "ACME.EXAMPLE",
        createdAt: new Date("2026-10-14T00:00:00.000Z"),
      },
      {
        domain: "acme.example",
        createdAt: new Date("2026-10-13T00:00:00.000Z"),
      },
    ]);

    expect(domains.map((item) => item.domain)).toEqual([
      "acme.example",
      "example.org",
    ]);
    expect(domains[0].createdAt.toISOString()).toBe(
      "2026-10-13T00:00:00.000Z",
    );
  });

  it("does not mutate source company or domain arrays", () => {
    const companyCopy = [...companies];
    const domainRows = [{
      domain: "company.example",
      createdAt: new Date("2026-10-14T00:00:00.000Z"),
    }];

    buildTpoTrustedCompanies(companies);
    buildTpoTrustedDomains(domainRows);

    expect(companies).toEqual(companyCopy);
    expect(domainRows).toHaveLength(1);
  });
});
