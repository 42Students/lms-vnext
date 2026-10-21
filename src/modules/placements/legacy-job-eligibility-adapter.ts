import { placementEligibilityPolicyInputSchema } from "./validation";

/** Use only an approved, college-scoped legacy ID crosswalk. Names and numeric
 * IDs are NOT portable UUIDs. This adapter is for controlled historical import,
 * never for public or client-supplied requests to the strict write endpoints. */
export type LegacyEligibilityCrosswalk = {
  programIds: Readonly<Record<string, string>>;
  batchIds: Readonly<Record<string, string>>;
  branchProgramIds: Readonly<Record<string, readonly string[]>>;
};

export class LegacyEligibilityMappingError extends Error {
  constructor(readonly field: string, message: string) {
    super(message);
    this.name = "LegacyEligibilityMappingError";
  }
}

function mappedIds(
  raw: unknown,
  field: string,
  crosswalk: Readonly<Record<string, string>>,
): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new LegacyEligibilityMappingError(field, "Expected a list.");
  const ids: string[] = [];
  for (const id of raw as unknown[]) {
    if ((typeof id !== "number" || !Number.isSafeInteger(id)) &&
      (typeof id !== "string" || !/^[0-9]+$/.test(id))) {
      throw new LegacyEligibilityMappingError(field, "Legacy ID must be an integer.");
    }
    const mapped = crosswalk[String(id)];
    if (!mapped) throw new LegacyEligibilityMappingError(field, "Unknown legacy ID: supply its scoped crosswalk.");
    ids.push(mapped);
  }
  return [...new Set(ids)];
}

function branchProgramIds(
  raw: unknown,
  crosswalk: Readonly<Record<string, readonly string[]>>,
): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new LegacyEligibilityMappingError("branches", "Expected branch names.");
  const matches: string[] = [];
  for (const value of raw as unknown[]) {
    if (typeof value !== "string" || !value.trim()) {
      throw new LegacyEligibilityMappingError("branches", "Invalid branch name.");
    }
    // Legacy free-text department names (for example CSE) are mapped only
    // through a manually verified, college-specific lookup, never guessed.
    const key = value.trim().toLocaleLowerCase("en-US");
    const mapped = Object.entries(crosswalk).find(
      ([name]) => name.trim().toLocaleLowerCase("en-US") === key,
    )?.[1];
    if (!mapped?.length) {
      throw new LegacyEligibilityMappingError("branches", "No approved program mapping for " + value);
    }
    matches.push(...mapped);
  }
  return [...new Set(matches)];
}

export function adaptLegacyJobEligibility(
  raw: unknown,
  crosswalk: LegacyEligibilityCrosswalk,
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new LegacyEligibilityMappingError("eligibility", "Expected legacy eligibility JSON object.");
  }
  const legacy = raw as Record<string, unknown>;
  // The vNext model lacks PG-only marks and diversity-only gender.
  // Never silently erase a restriction, or admit a wider applicant pool.
  if (legacy.pgMinPct != null) {
    throw new LegacyEligibilityMappingError("pgMinPct", "PG-only marks need an approved policy mapping.");
  }
  if (legacy.gender != null && String(legacy.gender).trim()) {
    throw new LegacyEligibilityMappingError("gender", "Diversity criteria need privacy-approved mapping.");
  }
  const programs = mappedIds(legacy.programIds, "programIds", crosswalk.programIds);
  const branches = branchProgramIds(legacy.branches, crosswalk.branchProgramIds);
  const intersected = programs.length && branches.length
    ? programs.filter(id => branches.includes(id)) : programs.length ? programs : branches;
  if (programs.length && branches.length && intersected.length === 0) {
    throw new LegacyEligibilityMappingError("branches", "Branch/program filters do not overlap.");
  }
  const policy = {
    allowedProgramIds: intersected,
    allowedCohortIds: mappedIds(legacy.batchIds, "batchIds", crosswalk.batchIds),
    allowedPassingYears: legacy.passingYears ?? [],
    minCgpa: legacy.minCgpa ?? null,
    minPctThroughout: legacy.minPctThroughout ?? null,
    minTenthPercentage: legacy.tenthMinPct ?? null,
    minTwelfthPercentage: legacy.twelfthMinPct ?? null,
    minDiplomaPercentage: legacy.diplomaMinPct ?? null,
    minUndergraduatePercentage: legacy.ugMinPct ?? null,
    requireVerifiedEvidence: legacy.verifiedMarksOnly ?? false,
    // Legacy deliberately ignores backlog/gap restrictions; do not copy
    // any unknown historical keys to new strict policy fields.
  };
  const parsed = placementEligibilityPolicyInputSchema.safeParse(policy);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new LegacyEligibilityMappingError(
      String(issue?.path[0] ?? "eligibility"),
      issue?.message ?? "Invalid legacy eligibility value.",
    );
  }
  return parsed.data;
}
