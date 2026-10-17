import "server-only";

import {
  and,
  asc,
  countDistinct,
  eq,
  exists,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import {resolvePlacementParticipationFromDecisions} from "@/modules/placements/access-service";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  placementEligibilityDecisions,
  learnerProfiles,
  membershipRoles,
  moduleAccessRules,
  users,
} from "@/db/schema";
import {
  type RequestContext,
} from "@/modules/identity/context";
import {
  requirePermission,
} from "@/modules/permissions/policy";
import {
  collegeIdSchema,
} from "@/modules/colleges/validation";

import {
  explainLearnerModuleAccess,
} from "./admin-trace-model";
import {
  buildModuleAccessChain,
  OPTIONAL_MODULE_KEYS,
  type ModuleAccessScope,
} from "./service";

export const adminModuleTraceQuerySchema =
  z.object({
    q: z.string().trim().max(100).default(""),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1),
    overridesOnly: z.enum(["all","only","locked"]).default("all"),
    overridesModule: z.enum(["projects","placements","electives"]).optional(),
    storedValue: z.enum(["all","on","off"]).default("all"),
    membershipId: z
      .string()
      .uuid()
      .optional(),
  }).strict();

const PAGE_SIZE = 25;

type LearnerDirectoryRow = {
  membershipId: string;
  displayName: string | null;
  rollNumber: string | null;
};

function subjectRuleCondition(
  scope: ModuleAccessScope,
): SQL {
  return and(
    eq(
      moduleAccessRules.scopeType,
      scope.scopeType,
    ),
    scope.scopeId === null
      ? isNull(moduleAccessRules.scopeId)
      : eq(
          moduleAccessRules.scopeId,
          scope.scopeId,
        ),
  )!;
}

/**
 * Each exact (scope type, scope ID) pair is selected.
 * An unrelated college rule with a coincidentally
 * matching UUID but a different type cannot become
 * part of this trace.
 */
async function readRulesForChain(
  chain: readonly ModuleAccessScope[],
) {
  return getDb()
    .select({
      scopeType: moduleAccessRules.scopeType,
      scopeId: moduleAccessRules.scopeId,
      module: moduleAccessRules.module,
      enabled: moduleAccessRules.enabled,
      locked: moduleAccessRules.locked,
    })
    .from(moduleAccessRules)
    .where(
      and(
        inArray(
          moduleAccessRules.module,
          [...OPTIONAL_MODULE_KEYS],
        ),
        or(
          ...chain.map(subjectRuleCondition),
        ),
      ),
    );
}

/**
 * The learner membership must be ACTIVE, have a
 * LEARNER role, belong to the college in the URL,
 * and belong to an active platform user.
 *
 * Only membership ID, display name and roll number
 * are returned to the UI. No email, phone number
 * or profile document is selected.
 */
export async function getSuperAdminLearnerAccessTrace(
  context: RequestContext,
  rawCollegeId: string,
  rawQuery: unknown = {},
) {
  requirePermission(
    context,
    "admin-scope.select",
  );

  const collegeId =
    collegeIdSchema.parse(rawCollegeId);
  const query =
    adminModuleTraceQuerySchema.parse(
      rawQuery,
    );

  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
    })
    .from(colleges)
    .where(
      eq(colleges.id, collegeId),
    )
    .limit(1);

  if (!college) {
    return null;
  }

  requirePermission(
    context,
    "college.read",
    {
      collegeId: college.id,
      organizationId:
        college.organizationId,
    },
  );

  const learnerFilters = and(
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
    eq(
      membershipRoles.role,
      "LEARNER",
    ),
    (query.overridesOnly !== "all" || Boolean(query.overridesModule) || query.storedValue !== "all")
      ? exists(db.select({id:moduleAccessRules.scopeId}).from(moduleAccessRules).where(and(
          eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
          eq(moduleAccessRules.scopeId,collegeMemberships.id),
          query.overridesModule ? eq(moduleAccessRules.module,query.overridesModule) : inArray(moduleAccessRules.module,[...OPTIONAL_MODULE_KEYS]),
          query.overridesOnly === "locked" ? eq(moduleAccessRules.locked,true) : undefined,
          query.storedValue !== "all" ? eq(moduleAccessRules.enabled,query.storedValue === "on") : undefined,
        )))
      : undefined,
    query.q
      ? sql<boolean>`(
          position(
            lower(${query.q})
            in lower(
              coalesce(${users.displayName}, '')
            )
          ) > 0
          or position(
            lower(${query.q})
            in lower(
              coalesce(${learnerProfiles.rollNumber}, '')
            )
          ) > 0
        )`
      : undefined,
  );

  const fromLearners = db
    .select({
      membershipId:
        collegeMemberships.id,
      displayName:
        users.displayName,
      rollNumber:
        learnerProfiles.rollNumber,
    })
    .from(collegeMemberships)
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
    .leftJoin(
      learnerProfiles,
      eq(
        learnerProfiles.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(learnerFilters);

  const [totals, learners] =
    await Promise.all([
      db
        .select({
          total: countDistinct(
            collegeMemberships.id,
          ),
        })
        .from(collegeMemberships)
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
        .leftJoin(
          learnerProfiles,
          eq(
            learnerProfiles.membershipId,
            collegeMemberships.id,
          ),
        )
        .where(learnerFilters),

      fromLearners
        .orderBy(
          asc(
            sql`lower(coalesce(${users.displayName}, ''))`,
          ),
          asc(collegeMemberships.id),
        )
        .limit(PAGE_SIZE)
        .offset(
          (query.page - 1) *
            PAGE_SIZE,
        ),
    ]);

  const total = totals[0]?.total ?? 0;

  let selected: {
    membershipId: string;
    displayName: string | null;
    rollNumber: string | null;
    chain: Awaited<
      ReturnType<typeof buildModuleAccessChain>
    >;
    modules: ReturnType<
      typeof explainLearnerModuleAccess
    >;
    placementParticipation:{
      status:"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
      level:"MEMBERSHIP"|"SECTION"|"COHORT"|null;
      reason:string|null;actorName:string|null;decidedAt:Date|null;
    };
  } | null = null;

  if (query.membershipId) {
    const [learner] = await db
      .select({
        membershipId:
          collegeMemberships.id,
        userId: users.id,
        identityUid: users.identityUid,
        displayName:
          users.displayName,
        rollNumber:
          learnerProfiles.rollNumber,
      })
      .from(collegeMemberships)
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
      .leftJoin(
        learnerProfiles,
        eq(
          learnerProfiles.membershipId,
          collegeMemberships.id,
        ),
      )
      .where(
        and(
          eq(
            collegeMemberships.id,
            query.membershipId,
          ),
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
          eq(
            membershipRoles.role,
            "LEARNER",
          ),
        ),
      )
      .limit(1);

    if (!learner) {
      // Unknown, inactive, non-learner and cross-
      // college IDs all receive the same 404.
      return null;
    }

    /*
     * Construct the verified learner context only
     * to call the production scope-chain builder.
     * This does not impersonate a session, invoke
     * a learner action or grant administrative rights.
     *
     * The learner's own identity and membership
     * values come from persisted rows, and no
     * identity fields are included in the response.
     */
    const learnerContext: RequestContext = {
      user: {
        id: learner.userId,
        identityUid:
          learner.identityUid,
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: learner.membershipId,
        collegeId: college.id,
        organizationId:
          college.organizationId,
        status: "ACTIVE",
        roles: ["LEARNER"],
      },
    };

    const chain =
      await buildModuleAccessChain(
        learnerContext,
      );

    const storedRules =
      await readRulesForChain(chain);

    // SA-tenants-modules-31: a placement-cell decision is independent of
    // module-access inheritance. Query exact pairs within the authorized
    // learner chain; never infer it from the "placements" module setting.
    const placementScopes=chain.filter(s=>["MEMBERSHIP","SECTION","COHORT"].includes(s.scopeType)&&s.scopeId);
    const participationRows=placementScopes.length?await db.select({
      scopeType:placementEligibilityDecisions.scopeType,
      scopeId:placementEligibilityDecisions.scopeId,
      status:placementEligibilityDecisions.status,
      reason:placementEligibilityDecisions.reason,
      note:placementEligibilityDecisions.note,
      decidedByUserId:placementEligibilityDecisions.decidedByUserId,
      decidedAt:placementEligibilityDecisions.decidedAt,
    }).from(placementEligibilityDecisions).where(and(
      eq(placementEligibilityDecisions.collegeId,college.id),
      or(...placementScopes.map(scope=>and(
        eq(placementEligibilityDecisions.scopeType,scope.scopeType),
        eq(placementEligibilityDecisions.scopeId,scope.scopeId!),
      ))),
    )):[];
    const resolvedParticipation=resolvePlacementParticipationFromDecisions(chain,participationRows);
    const winningPlacement=resolvedParticipation.level?participationRows.find(row=>
      row.scopeType===resolvedParticipation.level &&
      chain.some(scope=>scope.scopeType===row.scopeType&&scope.scopeId===row.scopeId)):null;
    const [placementActor]=winningPlacement?.decidedByUserId?await db.select({
      name:users.displayName,
    }).from(users).where(eq(users.id,winningPlacement.decidedByUserId)).limit(1):[];
    const placementParticipation={
      status:resolvedParticipation.status,
      level:resolvedParticipation.level,
      reason:resolvedParticipation.reason,
      actorName:placementActor?.name??null,
      decidedAt:winningPlacement?.decidedAt??null,
    };

    selected = {
      placementParticipation,
      membershipId:
        learner.membershipId,
      displayName:
        learner.displayName,
      rollNumber:
        learner.rollNumber,
      chain,
      modules:
        explainLearnerModuleAccess(
          chain,
          storedRules,
        ),
    };
  }

  return {
    college: {
      id: college.id,
      name: college.name,
      code: college.code,
    },
    query,
    learners: learners satisfies LearnerDirectoryRow[],
    total,
    page: query.page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(
      1,
      Math.ceil(total / PAGE_SIZE),
    ),
    selected,
  };
}
