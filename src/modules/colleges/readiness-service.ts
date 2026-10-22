import "server-only";

import {
  and,
  count,
  countDistinct,
  eq,
  isNull,
  ne,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  attendancePolicies,
  collegeBranding,
  cohorts,
  collegeMemberships,
  colleges,
  departments,
  learnerProgramEnrollments,
  lectureHalls,
  membershipRoles,
  placementSeasons,
  programs,
  tenantDomains,
  users,
} from "@/db/schema";
import {
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import type {
  MembershipRole,
} from "@/modules/identity/constants";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";

import {
  collegeIdSchema,
} from "./validation";
import {
  evaluateCollegeReadiness,
  type CollegeReadinessFacts,
} from "./readiness-model";
import {evaluateLegacyDomainLoginReadiness,validateLegacyDomainLoginReadinessResponse} from "./legacy-domain-login-readiness";
import {TENANT_RESOLVER_REQUIRES_VERIFIED_DOMAIN} from "@/modules/tenant-domains/repository";

function isMissingRelation(
  error: unknown,
): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 6; depth += 1) {
    if (
      !current ||
      typeof current !== "object"
    ) {
      break;
    }

    if (
      "code" in current &&
      current.code === "42P01"
    ) {
      return true;
    }

    current =
      "cause" in current
        ? current.cause
        : null;
  }

  return false;
}

/**
 * Missing registered relations are UNKNOWN rather
 * than PASS or an invented zero count.
 *
 * Do not hide connection, permission, syntax or
 * other runtime errors: those still reach the route
 * error boundary.
 */
async function safeCount(
  query: Promise<{
    total: number;
  }[]>,
): Promise<number | null> {
  try {
    const rows = await query;
    return rows[0]?.total ?? 0;
  } catch (error) {
    if (isMissingRelation(error)) {
      return null;
    }
    throw error;
  }
}

export async function getSuperAdminCollegeReadiness(
  context: RequestContext,
  collegeIdInput: string,
) {
  if (!isSuperAdmin(context)) {
    throw new AuthorizationError("college.read");
  }

  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      legacyUniqueId: colleges.legacyUniqueId,
      logoObjectPath: colleges.logoObjectPath,
      legacyLogoUrl: colleges.legacyLogoUrl,
      status: colleges.status,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college) {
    return null;
  }

  // Same centrally defined Super Admin resource
  // permission and selected-scope fence as the
  // existing Colleges service.
  requirePermission(context, "college.read", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const scopedCollegeId = college.id;

  function roleCount(
    role: MembershipRole,
  ) {
    return safeCount(
      db
        .select({
          total: countDistinct(
            collegeMemberships.id,
          ),
        })
        .from(collegeMemberships)
        .innerJoin(
          membershipRoles,
          eq(
            membershipRoles.membershipId,
            collegeMemberships.id,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .where(
          and(
            eq(
              collegeMemberships.collegeId,
              college.id,
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(
              users.platformStatus,
              "ACTIVE",
            ),
            eq(membershipRoles.role, role),
          ),
        ),
    );
  }

  // Every query is tied directly or transitively to
  // the stored college ID. Cross-college memberships,
  // programs, cohorts and enrollments cannot count.
  const [
    adminMemberships,
    activeDepartments,
    activePrograms,
    availableCohorts,
    enrolledLearners,
    facultyMemberships,
    tpoMemberships,
    activePlacementSeasons,
    verifiedPrimaryDomains,
    activeLectureHalls,
    storedAttendancePolicies,
  ] = await Promise.all([
    roleCount("COLLEGE_ADMIN"),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(departments)
        .where(
          and(
            eq(departments.collegeId, college.id),
            isNull(departments.archivedAt),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(programs)
        .innerJoin(
          departments,
          eq(
            departments.id,
            programs.departmentId,
          ),
        )
        .where(
          and(
            eq(departments.collegeId, college.id),
            isNull(departments.archivedAt),
            eq(programs.status, "ACTIVE"),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(cohorts)
        .innerJoin(
          programs,
          eq(programs.id, cohorts.programId),
        )
        .innerJoin(
          departments,
          eq(
            departments.id,
            programs.departmentId,
          ),
        )
        .where(
          and(
            eq(departments.collegeId, college.id),
            isNull(departments.archivedAt),
            eq(programs.status, "ACTIVE"),
            ne(cohorts.status, "ARCHIVED"),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: countDistinct(
            collegeMemberships.id,
          ),
        })
        .from(learnerProgramEnrollments)
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            learnerProgramEnrollments.membershipId,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .innerJoin(
          membershipRoles,
          eq(
            membershipRoles.membershipId,
            collegeMemberships.id,
          ),
        )
        .innerJoin(
          programs,
          eq(
            programs.id,
            learnerProgramEnrollments.programId,
          ),
        )
        .innerJoin(
          cohorts,
          and(
            eq(
              cohorts.id,
              learnerProgramEnrollments.cohortId,
            ),
            eq(
              cohorts.programId,
              programs.id,
            ),
          ),
        )
        .innerJoin(
          departments,
          eq(
            departments.id,
            programs.departmentId,
          ),
        )
        .where(
          and(
            eq(
              collegeMemberships.collegeId,
              college.id,
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(
              users.platformStatus,
              "ACTIVE",
            ),
            eq(membershipRoles.role, "LEARNER"),
            eq(
              learnerProgramEnrollments.status,
              "ACTIVE",
            ),
            eq(
              departments.collegeId,
              college.id,
            ),
            isNull(departments.archivedAt),
            eq(programs.status, "ACTIVE"),
            ne(cohorts.status, "ARCHIVED"),
          ),
        ),
    ),

    roleCount("FACULTY"),
    roleCount("TPO"),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(placementSeasons)
        .where(
          and(
            eq(
              placementSeasons.collegeId,
              college.id,
            ),
            eq(
              placementSeasons.status,
              "ACTIVE",
            ),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(tenantDomains)
        .where(
          and(
            eq(
              tenantDomains.collegeId,
              college.id,
            ),
            eq(
              tenantDomains.isVerified,
              true,
            ),
            eq(
              tenantDomains.isPrimary,
              true,
            ),
            isNull(tenantDomains.deletedAt),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(lectureHalls)
        .where(
          and(
            eq(
              lectureHalls.collegeId,
              college.id,
            ),
            eq(
              lectureHalls.status,
              "ACTIVE",
            ),
          ),
        ),
    ),

    safeCount(
      db
        .select({
          total: count(),
        })
        .from(attendancePolicies)
        .where(
          eq(
            attendancePolicies.collegeId,
            college.id,
          ),
        ),
    ),
  ]);

  // Legacy onboarding reports active domain totals separately from the
  // general ten-check go-live gate; archived/tombstoned hosts never count.
  const [domainTotal,domainVerified,domainPrimary]=await Promise.all([
    safeCount(db.select({total:count()}).from(tenantDomains).where(and(
      eq(tenantDomains.collegeId,college.id),isNull(tenantDomains.deletedAt)))),
    safeCount(db.select({total:count()}).from(tenantDomains).where(and(
      eq(tenantDomains.collegeId,college.id),isNull(tenantDomains.deletedAt),
      eq(tenantDomains.isVerified,true)))),
    safeCount(db.select({total:count()}).from(tenantDomains).where(and(
      eq(tenantDomains.collegeId,college.id),isNull(tenantDomains.deletedAt),
      eq(tenantDomains.isPrimary,true)))),
  ]);
  // Branding remains advisory. If the optional relation is not registered,
  // do not mistake absence of evidence for an absent logo.
  let brandingLogo:string|null|undefined;
  try {
    const [branding]=await db.select({logoUrl:collegeBranding.logoUrl})
      .from(collegeBranding).where(eq(collegeBranding.collegeId,college.id)).limit(1);
    brandingLogo=branding?.logoUrl??null;
  } catch(error){
    if(!isMissingRelation(error))throw error;
    brandingLogo=undefined;
  }
  // The current vNext tenant resolver requires verified hosts; pass that same
  // policy explicitly rather than reading a divergent "strict" env default.
  // The pure adapter also supports historic lenient readiness for test/crosswalk.
  const requireVerifiedDomains=TENANT_RESOLVER_REQUIRES_VERIFIED_DOMAIN;
  const domainPolicy=validateLegacyDomainLoginReadinessResponse(evaluateLegacyDomainLoginReadiness({
    requireVerifiedDomains,domainTotal,domainVerified,domainPrimary,verifiedPrimaryDomains,
    hasLogo:college.logoObjectPath?.trim()||college.legacyLogoUrl?.trim()?true:
      brandingLogo===undefined?null:Boolean(brandingLogo?.trim()),
    departments:activeDepartments,facultyMemberships,enrolledLearners,
  }));

  const facts: CollegeReadinessFacts = {
    collegeStatus: college.status,
    adminMemberships,
    departments: activeDepartments,
    programs: activePrograms,
    cohorts: availableCohorts,
    enrolledLearners,
    facultyMemberships,
    tpoMemberships,
    activePlacementSeasons,
    verifiedPrimaryDomains,
  };

  // A college can be archived while expensive independent readiness counts
  // run. Never return an old ACTIVE status with a false green readiness gate.
  // Role and college lifecycle are checked under locks at the response edge.
  const currentCollege=await db.transaction(async tx=>{
    const [latest]=await tx.select({status:colleges.status,organizationId:colleges.organizationId})
      .from(colleges).where(eq(colleges.id,college.id)).for("share").limit(1);
    if(!latest||latest.organizationId!==college.organizationId)
      throw new AuthorizationError("college.read");
    await assertPersistedPlatformPermission(tx,context,"college.read",{
      collegeId:college.id,organizationId:latest.organizationId,
    });
    return latest;
  });
  facts.collegeStatus=currentCollege.status;
  const evaluation=evaluateCollegeReadiness(facts);
  const domainLoginReady=domainPolicy.readyForDomainLogin===null?null:
    currentCollege.status==="ACTIVE"&&domainPolicy.readyForDomainLogin;
  const tenantSetupComplete=evaluation.overall==="INCOMPLETE"?null:
    evaluation.overall==="READY";
  return {
    college:{...college,status:currentCollege.status},
    evaluation,
    // Domain-based login may be configured even if the college has no active
    // placement season, programmes or TPO team. Never label those operational
    // setup gaps as a login outage. Runtime DNS/auth still need probing.
    readinessGates:{domainLoginReady,tenantSetupComplete},
    legacyDomainReadiness:{
      readyForDomainLogin:domainLoginReady,
      blockers:domainPolicy.blockers,
      warnings:domainPolicy.warnings,
      recommendedActions:domainPolicy.recommendedActions,
      meta:{
        collegeId:college.id,
        collegeName:college.name,
        organizationId:college.organizationId,
        uniqueId:college.legacyUniqueId??college.code,
        domainTotal,domainVerified,domainPrimary,
        requireVerifiedDomains,
      },
    },
    supplemental: {
      activeLectureHalls,
      attendancePolicyRecord:
        storedAttendancePolicies === null
          ? null
          : storedAttendancePolicies > 0,
    },
  };
}
