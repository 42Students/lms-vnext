export type RecruiterSelfGrantFact = {
  id: string;
  collegeName: string;
  collegeCode?: string;
  grantStatus: string;
  relationshipStatus: string;
  grantedAt: Date;
};

export type RecruiterSelfGrantRow = {
  id: string;
  collegeName: string;
  collegeCode?: string;
  grantStatus: "ACTIVE";
  relationshipStatus: "ACTIVE";
  grantedAtIso: string;
  grantedAtLabel: string;
};

const dateFormatter = new Intl.DateTimeFormat(
  "en-GB",
  {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
);

/**
 * Pure presentation helper.
 *
 * Authorization and college/company relationships must
 * already be checked by the calling read service.
 *
 * Only currently active grants to active company
 * relationships are represented. Revoked or archived
 * grants are not presented as current access.
 */
export function buildRecruiterSelfGrantRows(
  facts: readonly RecruiterSelfGrantFact[],
): RecruiterSelfGrantRow[] {
  return facts
    .filter(
      (fact) =>
        fact.grantStatus === "ACTIVE" &&
        fact.relationshipStatus === "ACTIVE",
    )
    .map((fact) => ({
      id: fact.id,
      collegeName: fact.collegeName,
      ...(fact.collegeCode ? {collegeCode:fact.collegeCode} : {}),
      grantStatus: "ACTIVE" as const,
      relationshipStatus: "ACTIVE" as const,
      grantedAtIso:
        fact.grantedAt.toISOString(),
      grantedAtLabel:
        dateFormatter.format(fact.grantedAt),
    }))
    .sort(
      (left, right) =>
        left.collegeName.localeCompare(
          right.collegeName,
        ) ||
        left.id.localeCompare(right.id),
    );
}
