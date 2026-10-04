export type CollegeUsage = {
  memberships: number;
  departments: number;
  academicPeriods: number;
  projectTemplateAssignments: number;
  projects: number;
  placementRelationships: number;
  placementSeasons: number;
  placementJobs: number;
  tenantDomains: number;
};

export class CollegeHasDependenciesError extends Error {
  readonly code = "COLLEGE_HAS_DEPENDENCIES";

  constructor(public readonly usage: CollegeUsage) {
    super("COLLEGE_HAS_DEPENDENCIES");
    this.name = "CollegeHasDependenciesError";
  }
}

export function hasCollegeDependencies(
  usage: CollegeUsage,
) {
  return Object.values(usage).some(
    (count) => count > 0,
  );
}

export function assertCollegeCanArchive(
  usage: CollegeUsage,
) {
  if (hasCollegeDependencies(usage)) {
    throw new CollegeHasDependenciesError(
      usage,
    );
  }
}
