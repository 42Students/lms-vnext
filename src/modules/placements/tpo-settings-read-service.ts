import "server-only";

import {
  count,
  desc,
  eq,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  placementJobEligibilityPolicies,
  placementJobs,
  colleges,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";

import { listPlacementSeasons } from "./season-service";
import { requirePlacementManageScope } from "./scope";
import { getCollegePlacementRules } from "./tpo-policy-service";
import {
  orderTpoSettingsSeasons,
  summarizeTpoSettingsSeasons,
  tpoSettingOrigin,
} from "./tpo-settings-model";

const rulesPageSchema = z
  .object({
    page: z.union([
      z.number().int().min(1).max(10000),
      z.string().regex(/^[1-9][0-9]*$/)
        .transform(Number).pipe(z.number().int().min(1).max(10000)),
    ]).default(1),
  })
  .strict();

const JOB_PAGE_SIZE = 25;

/** All work done after preflight still has to survive a role or college
 * archival race before private settings leave the service. */
async function assertLiveTpoSettingsRead(context:RequestContext,collegeId:string){
 await getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.manage");
  const actor=await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  if(!hasMembershipRole(actor,"TPO"))throw new AuthorizationError("placements.manage");
 });
}

/**
 * The target college always comes from the active
 * TPO membership, never from a request parameter.
 *
 * The central permission guard independently checks
 * placements.manage against that exact college and
 * its organization.
 */
async function requireTpoSettingsCollege(
  context: RequestContext,
): Promise<string> {
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  const collegeId = context.membership.collegeId;

  await requirePlacementManageScope(
    context,
    collegeId,
  );

  return collegeId;
}

export async function getTpoPlacementSeasonSettings(
  context: RequestContext,
) {
  const collegeId =
    await requireTpoSettingsCollege(context);

  // This existing read service also performs the
  // central placements.manage scope check.
  const records = await listPlacementSeasons(
    context,
    collegeId,
  );

  const seasons = orderTpoSettingsSeasons(
    records.map((season) => ({
      id: season.id,
      name: season.name,
      code: season.code,
      startDate: season.startDate,
      endDate: season.endDate,
      status: season.status,
      closedAt: season.closedAt,
      updatedAt: season.updatedAt.toISOString(),
    })),
  );

  await assertLiveTpoSettingsRead(context,collegeId);
  return {
    seasons,
    summary: summarizeTpoSettingsSeasons(
      seasons,
    ),
  };
}

export async function getTpoPlacementRulesSettings(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  const collegeId =
    await requireTpoSettingsCollege(context);

  const query = rulesPageSchema.parse(
    rawQuery,
  );

  const db = getDb();

  const [collegeRules, counts, rows] =
    await Promise.all([
      // This service supplies actual persisted values
      // or its established, non-writing V162 defaults.
      getCollegePlacementRules(
        context,
        collegeId,
      ),
      db
        .select({
          total: count(),
        })
        .from(placementJobs)
        .where(
          eq(
            placementJobs.collegeId,
            collegeId,
          ),
        ),
      db
        .select({
          jobId: placementJobs.id,
          jobTitle: placementJobs.title,
          jobStatus: placementJobs.status,
          policyJobId:
            placementJobEligibilityPolicies.jobId,
          minCgpaHundredths:
            placementJobEligibilityPolicies.minCgpaHundredths,
          maxActiveBacklogs:
            placementJobEligibilityPolicies.maxActiveBacklogs,
          maxPastBacklogs:
            placementJobEligibilityPolicies.maxPastBacklogs,
          minTenthPctBasisPoints:
            placementJobEligibilityPolicies.minTenthPctBasisPoints,
          minTwelfthPctBasisPoints:
            placementJobEligibilityPolicies.minTwelfthPctBasisPoints,
          minDiplomaPctBasisPoints:
            placementJobEligibilityPolicies.minDiplomaPctBasisPoints,
          minUndergraduatePctBasisPoints:
            placementJobEligibilityPolicies.minUndergraduatePctBasisPoints,
          maxGapYears:
            placementJobEligibilityPolicies.maxGapYears,
          allowedProgramIds:
            placementJobEligibilityPolicies.allowedProgramIds,
          allowedCohortIds:
            placementJobEligibilityPolicies.allowedCohortIds,
          allowedPassingYears:
            placementJobEligibilityPolicies.allowedPassingYears,
          missingEvidencePolicy:
            placementJobEligibilityPolicies.missingEvidencePolicy,
        })
        .from(placementJobs)
        .leftJoin(
          placementJobEligibilityPolicies,
          eq(
            placementJobEligibilityPolicies.jobId,
            placementJobs.id,
          ),
        )
        .where(
          eq(
            placementJobs.collegeId,
            collegeId,
          ),
        )
        .orderBy(
          desc(placementJobs.createdAt),
          desc(placementJobs.id),
        )
        .limit(JOB_PAGE_SIZE)
        .offset(
          (query.page - 1) * JOB_PAGE_SIZE,
        ),
    ]);

  await assertLiveTpoSettingsRead(context,collegeId);
  const totalJobs = counts[0]?.total ?? 0;

  return {
    collegeRules: {
      countsAsPlacedAt:
        collegeRules.countsAsPlacedAt,
      maxHeldOffers: collegeRules.maxHeldOffers,
      upliftPct: collegeRules.upliftPct,
      minResponseHours:
        collegeRules.minResponseHours,
      source: tpoSettingOrigin(
        collegeRules.updatedAt,
      ),
      updatedAt: collegeRules.updatedAt,
    },
    jobs: rows.map((row) => ({
      id: row.jobId,
      title: row.jobTitle,
      status: row.jobStatus,
      source: row.policyJobId
        ? ("PERSISTED" as const)
        : ("SOURCE_DEFAULT" as const),
      minCgpaHundredths:
        row.minCgpaHundredths,
      maxActiveBacklogs:
        row.maxActiveBacklogs,
      maxPastBacklogs:
        row.maxPastBacklogs,
      minTenthPctBasisPoints:
        row.minTenthPctBasisPoints,
      minTwelfthPctBasisPoints:
        row.minTwelfthPctBasisPoints,
      minDiplomaPctBasisPoints:
        row.minDiplomaPctBasisPoints,
      minUndergraduatePctBasisPoints:
        row.minUndergraduatePctBasisPoints,
      maxGapYears: row.maxGapYears,
      allowedProgramCount:
        row.allowedProgramIds?.length ?? 0,
      allowedCohortCount:
        row.allowedCohortIds?.length ?? 0,
      allowedPassingYears:
        row.allowedPassingYears ?? [],
      missingEvidencePolicy:
        row.missingEvidencePolicy ??
        "ALLOW_WITH_FLAG",
    })),
    page: query.page,
    pageSize: JOB_PAGE_SIZE,
    totalJobs,
    totalPages: Math.max(
      1,
      Math.ceil(totalJobs / JOB_PAGE_SIZE),
    ),
  };
}
