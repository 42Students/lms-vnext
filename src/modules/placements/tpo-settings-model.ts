export type TpoSettingsSeason = {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  closedAt: Date | null;
};

export function orderTpoSettingsSeasons<
  T extends TpoSettingsSeason,
>(seasons: readonly T[]): T[] {
  return [...seasons].sort((left, right) => {
    const leftActive = left.status === "ACTIVE" ? 0 : 1;
    const rightActive = right.status === "ACTIVE" ? 0 : 1;

    return (
      leftActive - rightActive ||
      right.startDate.localeCompare(left.startDate) ||
      right.endDate.localeCompare(left.endDate) ||
      left.id.localeCompare(right.id)
    );
  });
}

export function summarizeTpoSettingsSeasons(
  seasons: readonly Pick<TpoSettingsSeason, "status">[],
) {
  const active = seasons.filter(
    (season) => season.status === "ACTIVE",
  ).length;
  const closed = seasons.filter(
    (season) => season.status === "CLOSED",
  ).length;

  return {
    total: seasons.length,
    active,
    closed,
  };
}

export type TpoSettingOrigin =
  | "PERSISTED"
  | "SOURCE_DEFAULT";

export function tpoSettingOrigin(
  persistedUpdatedAt: Date | null | undefined,
): TpoSettingOrigin {
  return persistedUpdatedAt
    ? "PERSISTED"
    : "SOURCE_DEFAULT";
}

export function formatTpoEligibilityThreshold(
  hundredths: number | null,
): string {
  return hundredths === null
    ? "No minimum"
    : (hundredths / 100).toFixed(2);
}

export const TPO_FIXED_PLACEMENT_RULE_NOTES = [
  {
    title: "Placement participation precedence",
    value:
      "Learner decision → class/section decision → batch/cohort decision",
    detail:
      "An absent decision remains NOT_DECIDED. This is a separate gate from job-specific academic eligibility.",
    source: "Source-configured",
  },
  {
    title: "Missing job eligibility evidence",
    value: "ALLOW_WITH_FLAG",
    detail:
      "If a job has no persisted eligibility policy, the source default permits incomplete evidence with a flag. An explicit job policy may instead REQUIRE_COMPLETE.",
    source: "Source default for unconfigured jobs",
  },
  {
    title: "Academic thresholds",
    value: "No fixed numeric minima",
    detail:
      "CGPA, board percentages, backlog limits, passing years and gap-year limits are evaluated only when configured on the individual job policy.",
    source: "Source-configured job eligibility behavior",
  },
  {
    title: "Registration window",
    value: "Cohort invitation and deadline",
    detail:
      "Registration is cohort-specific. An invitation is required, a finished cohort is closed to self-registration, and the deadline is exclusive. An ACTIVE placement season does not prove registration is open.",
    source: "Source-configured participation behavior",
  },
] as const;

/**
 * Rules settings pagination is an untrusted URL boundary. Never coerce
 * hexadecimal, exponents, whitespace or ambiguous repeated query keys into a
 * valid page. A malformed filter must fail before fetching college job data.
 */
export function parseTpoRulesPageParams(
 raw:Record<string,string|string[]|undefined>,
):number|null{
 if(Object.keys(raw).some(key=>key!=="page"))return null;
 const candidate=raw.page;
 if(candidate===undefined)return 1;
 if(typeof candidate!=="string"||!/^[1-9][0-9]*$/.test(candidate))return null;
 const value=Number(candidate);
 return Number.isSafeInteger(value)&&value<=10000?value:null;
}
