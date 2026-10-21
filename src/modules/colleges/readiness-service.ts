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
  const legacyBlockers:string[]=[];
  const legacyWarnings:string[]=[];
  const legacyActions:string[]=[];
  if(domainTotal!==null&&domainVerified!==null&&domainPrimary!==null){
    if(domainTotal===0){
      legacyBlockers.push("NO_DOMAIN");
      legacyActions.push("Add at least one domain under Superadmin → Tenant Domains.");
    }
    if(domainTotal>0&&domainPrimary===0){
      legacyBlockers.push("NO_PRIMARY_DOMAIN");
      legacyActions.push("Mark exactly one domain as Primary for this college.");
    }
    if(domainPrimary>1){
      legacyBlockers.push("MULTIPLE_PRIMARY_DOMAINS");
      legacyActions.push("Ensure only one domain is Primary (others must be non-primary).");
    }
    // vNext's primary_verified database constraint and tenant resolver always
    // demand a verified primary, even when imported historic hosts exist.
    if(domainTotal>0&&verifiedPrimaryDomains===0){
      legacyBlockers.push("NO_VERIFIED_PRIMARY_DOMAIN");
      legacyActions.push("Verify the Primary domain (TXT verification) before real logins.");
      if(domainVerified===0)legacyWarnings.push("NO_VERIFIED_DOMAIN");
      else if(domainPrimary>0)legacyWarnings.push("PRIMARY_DOMAIN_NOT_VERIFIED");
    }
  }
  if(!college.logoObjectPath&&!college.legacyLogoUrl){
    legacyWarnings.push("MISSING_LOGO");
    legacyActions.push("Add a logo (college logo or branding logo).");
  }
  if([activeDepartments,facultyMemberships,enrolledLearners].some(value=>value===0)){
    legacyWarnings.push("EMPTY_COLLEGE_NO_ACADEMIC_DATA");
    legacyActions.push("Add departments, faculty, and students — this college is missing at least one.");
  }

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
  return {
    college:{...college,status:currentCollege.status},
    evaluation:
      evaluateCollegeReadiness(facts),
    legacyDomainReadiness:{
      readyForDomainLogin:domainTotal===null||domainPrimary===null||
        verifiedPrimaryDomains===null?null:legacyBlockers.length===0,
      blockers:legacyBlockers,
      warnings:legacyWarnings,
      recommendedActions:legacyActions,
      meta:{
        collegeId:college.id,
        collegeName:college.name,
        organizationId:college.organizationId,
        uniqueId:college.legacyUniqueId??college.code,
        domainTotal,domainVerified,domainPrimary,
        requireVerifiedDomains:true,
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
