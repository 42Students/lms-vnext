export type RecruiterSelfGrantFact = {
  id: string;
  collegeName: string;
  collegeCode?: string;
  grantStatus: string;
  relationshipStatus: string;
  grantedAt: Date;
  validUntil?: Date | null;
};

export type RecruiterSelfGrantRow = {
  id: string;
  collegeName: string;
  collegeCode?: string;
  grantStatus: "ACTIVE";
  relationshipStatus: "ACTIVE";
  grantedAtIso: string;
  grantedAtLabel: string;
  accessExpiryLabel: string;
  validUntilIso: string | null;
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

const accessExpiryFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
});

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
      validUntilIso: fact.validUntil?.toISOString() ?? null,
      accessExpiryLabel: fact.validUntil
        ? "Access until " + accessExpiryFormatter.format(fact.validUntil) +
          ". The placement cell can extend it."
        : "Access has no end date",
    }))
    .sort(
      (left, right) =>
        left.collegeName.localeCompare(
          right.collegeName,
        ) ||
        left.id.localeCompare(right.id),
    );
}
