export type TpoTeamEvidenceRole =
  | "TPO"
  | "TPO_ADMIN"
  | "COLLEGE_ADMIN"
  | "FACULTY_COORDINATOR"
  | "STUDENT_COORDINATOR";

export type TpoTeamEvidenceRow = {
  membershipId: string;
  displayName: string | null;
  membershipStatus: string;
  platformStatus: string;
  role: TpoTeamEvidenceRole;
  jobId?: string | null;
  jobTitle?: string | null;
  onDate?: string | null;
};

export type TpoTeamDuty = {
  jobId: string;
  jobTitle: string;
  onDate: string;
};

export type TpoTeamMember = {
  membershipId: string;
  displayName: string;
  status: "ACTIVE";
  roles: TpoTeamEvidenceRole[];
  studentDuties: TpoTeamDuty[];
};

const ROLE_ORDER: readonly TpoTeamEvidenceRole[] = [
  "TPO_ADMIN",
  "TPO",
  "COLLEGE_ADMIN",
  "FACULTY_COORDINATOR",
  "STUDENT_COORDINATOR",
];

export const TPO_TEAM_ROLE_LABELS: Record<
  TpoTeamEvidenceRole,
  string
> = {
  TPO: "TPO membership",
  TPO_ADMIN: "TPO Admin assignment",
  COLLEGE_ADMIN:"College Admin",
  FACULTY_COORDINATOR: "Faculty Coordinator",
  STUDENT_COORDINATOR: "Student Coordinator",
};

/**
 * Deduplicate role and duty evidence into one row per active
 * college membership. A Faculty role by itself is not evidence
 * of a Faculty Coordinator assignment, and a Learner role by
 * itself is not evidence of a Student Coordinator assignment.
 *
 * Student duties are persisted, dated drive assignments. They
 * do not imply an ongoing institution-wide coordinator role.
 */
export function buildTpoTeamRoster(
  evidence: readonly TpoTeamEvidenceRow[],
): TpoTeamMember[] {
  const members = new Map<string, TpoTeamMember>();
  const duties = new Map<string, Set<string>>();

  for (const row of evidence) {
    if (
      row.membershipStatus !== "ACTIVE" ||
      row.platformStatus !== "ACTIVE"
    ) {
      continue;
    }

    let member = members.get(row.membershipId);

    if (!member) {
      member = {
        membershipId: row.membershipId,
        displayName: row.displayName?.trim() || "Unnamed member",
        status: "ACTIVE",
        roles: [],
        studentDuties: [],
      };
      members.set(row.membershipId, member);
    }

    if (!member.roles.includes(row.role)) {
      member.roles.push(row.role);
    }

    if (
      row.role === "STUDENT_COORDINATOR" &&
      row.jobId &&
      row.onDate
    ) {
      const key = `${row.jobId}:${row.onDate}`;
      const seen = duties.get(row.membershipId) ?? new Set<string>();

      if (!seen.has(key)) {
        seen.add(key);
        duties.set(row.membershipId, seen);

        member.studentDuties.push({
          jobId: row.jobId,
          jobTitle: row.jobTitle?.trim() || "Unnamed drive",
          onDate: row.onDate,
        });
      }
    }
  }

  for (const member of members.values()) {
    member.roles.sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b),
    );

    member.studentDuties.sort(
      (a, b) =>
        b.onDate.localeCompare(a.onDate) ||
        a.jobTitle.localeCompare(b.jobTitle) ||
        a.jobId.localeCompare(b.jobId),
    );
  }

  return [...members.values()].sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName) ||
      a.membershipId.localeCompare(b.membershipId),
  );
}

export function summarizeTpoTeam(
  members: readonly TpoTeamMember[],
) {
  return {
    total: members.length,
    tpoMemberships: members.filter((member) =>
      member.roles.includes("TPO"),
    ).length,
    tpoAdmins: members.filter((member) =>
      member.roles.includes("TPO_ADMIN"),
    ).length,
    facultyCoordinators: members.filter((member) =>
      member.roles.includes("FACULTY_COORDINATOR"),
    ).length,
    studentCoordinators: members.filter((member) =>
      member.roles.includes("STUDENT_COORDINATOR"),
    ).length,
    studentDutyAssignments: members.reduce(
      (count, member) => count + member.studentDuties.length,
      0,
    ),
  };
}

export type TpoTrustedCompanySource = {
  companyId: string;
  relationshipId: string;
  name: string;
  primaryDomain: string | null;
  isTrusted: boolean;
};

export type TpoTrustedCompany = TpoTrustedCompanySource;

export type TpoTrustedDomainSource = {
  domain: string;
  createdAt: Date;
};

export function buildTpoTrustedCompanies(
  rows: readonly TpoTrustedCompanySource[],
) {
  const companies: TpoTrustedCompany[] = [...rows].sort(
    (a, b) =>
      a.name.localeCompare(b.name) ||
      a.companyId.localeCompare(b.companyId),
  );

  return {
    companies,
    total: companies.length,
    trusted: companies.filter((row) => row.isTrusted).length,
    notTrusted: companies.filter((row) => !row.isTrusted).length,
  };
}

/**
 * Only explicit rows from placement_tpo_trusted_domains
 * may populate this trusted-domain list. Do not derive an
 * allowlist from a company's primaryDomain or tenant_domains.
 */
export function buildTpoTrustedDomains(
  rows: readonly TpoTrustedDomainSource[],
): TpoTrustedDomainSource[] {
  const domains = new Map<string, TpoTrustedDomainSource>();

  for (const row of rows) {
    const domain = row.domain.trim().toLowerCase();

    if (!domain) continue;

    const previous = domains.get(domain);

    if (
      !previous ||
      row.createdAt.getTime() < previous.createdAt.getTime()
    ) {
      domains.set(domain, {
        domain,
        createdAt: row.createdAt,
      });
    }
  }

  return [...domains.values()].sort(
    (a, b) => a.domain.localeCompare(b.domain),
  );
}
