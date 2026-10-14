import { z } from "zod";

export const learnerPlacementRulesQuerySchema = z.object({
  from: z.enum(["dashboard", "cell", "drives"]).optional(),
}).strict();

export function placementRulesBackLink(rawQuery: unknown) {
  const query = learnerPlacementRulesQuerySchema.parse(rawQuery);
  if (query.from === "cell") {
    return { href: "/learn/my-placements/placement", label: "Back to Placement Cell" };
  }
  if (query.from === "drives") {
    return { href: "/learn/my-placements/jobs", label: "Back to Drives" };
  }
  return { href: "/learn/my-placements", label: "Back to My Placements" };
}

export type PlacementPreparationInput = {
  evidence: {
    cgpa: number | null;
    activeBacklogs: number | null;
    gapYears: number | null;
    source: string;
  } | null;
  preferences: {
    preferredRoleTitles: readonly string[];
    preferredLocations: readonly string[];
  };
};

export function learnerPlacementPreparation(input: PlacementPreparationInput) {
  const has = (value: number | null | undefined) => value !== null &&
    value !== undefined && Number.isFinite(value);
  const criteria = [
    {
      key: "cgpa",
      label: "CGPA recorded",
      recorded: has(input.evidence?.cgpa),
      detail: has(input.evidence?.cgpa)
        ? String(input.evidence!.cgpa) + " (recorded)"
        : "CGPA is not recorded",
    },
    {
      key: "backlogs",
      label: "Active backlog count recorded",
      recorded: has(input.evidence?.activeBacklogs),
      detail: has(input.evidence?.activeBacklogs)
        ? String(input.evidence!.activeBacklogs) + " active backlogs recorded"
        : "Active backlog count is not recorded",
    },
    {
      key: "gapYears",
      label: "Gap years recorded",
      recorded: has(input.evidence?.gapYears),
      detail: has(input.evidence?.gapYears)
        ? String(input.evidence!.gapYears) + " gap years recorded"
        : "Gap-year count is not recorded",
    },
    {
      key: "roles",
      label: "Preferred roles recorded",
      recorded: input.preferences.preferredRoleTitles.length > 0,
      detail: input.preferences.preferredRoleTitles.length > 0
        ? input.preferences.preferredRoleTitles.join(", ")
        : "No preferred roles recorded",
    },
    {
      key: "locations",
      label: "Preferred locations recorded",
      recorded: input.preferences.preferredLocations.length > 0,
      detail: input.preferences.preferredLocations.length > 0
        ? input.preferences.preferredLocations.join(", ")
        : "No preferred locations recorded",
    },
  ] as const;
  return {
    hasAcademicEvidence: input.evidence !== null,
    academicSource: input.evidence?.source ?? null,
    criteria,
    recordedCount: criteria.filter((criterion) => criterion.recorded).length,
    totalCount: criteria.length,
  };
}
