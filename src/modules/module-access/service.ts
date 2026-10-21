import {
  and,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  departments,
  learnerProgramEnrollments,
  moduleAccessRules,
  programs,
  sectionEnrollments,
  sections,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";

/** Exact old ModuleFeatureCatalog order and app_settings key crosswalk.
 * Legacy LEARNER/CLASS/BATCH scopes are MEMBERSHIP/SECTION/COHORT here;
 * rules are now stored in module_access_rules with UUID scopes rather than
 * AppSettingRepository values. Courses/audiences are separate permissions and
 * must be checked independently of these optional-module switches. */
export const LEGACY_MODULE_SETTING_KEYS = {
  projects:"module.projects.enabled",
  placements:"module.placements.enabled",
  electives:"module.electives.enabled",
} as const;
export const LEGACY_SCOPE_NAME_BY_VNEXT = {
  MEMBERSHIP:"LEARNER",SECTION:"CLASS",COHORT:"BATCH",
  PROGRAM:"PROGRAM",DEPARTMENT:"DEPARTMENT",COLLEGE:"COLLEGE",
  ORGANIZATION:"ORGANIZATION",GLOBAL:"GLOBAL",
} as const;
export const OPTIONAL_MODULE_KEYS = [
  "projects",
  "placements",
  "electives",
] as const;

export type OptionalModuleKey =
  (typeof OPTIONAL_MODULE_KEYS)[number];

export type ModuleAccessScopeType =
  | "MEMBERSHIP"
  | "SECTION"
  | "COHORT"
  | "PROGRAM"
  | "DEPARTMENT"
  | "COLLEGE"
  | "ORGANIZATION"
  | "GLOBAL";

export type ModuleAccessScope = {
  scopeType: ModuleAccessScopeType;
  scopeId: string | null;
};

export type ModuleAccessRule = {
  scopeType: string;
  scopeId: string | null;
  module: string;
  enabled: boolean;
  locked: boolean;
};

export type ModuleAccessResolution = {
  enabled: boolean;
  level: ModuleAccessScopeType | "DEFAULT";
  scopeId: string | null;
  locked: boolean;
};

export type OptionalModuleAccess = Record<
  OptionalModuleKey,
  ModuleAccessResolution
>;

const DEFAULTS: Record<OptionalModuleKey, boolean> = {
  projects: true,
  placements: false,
  electives: true,
};

/** A DEFAULT-level result differs from an explicitly persisted disabled rule.
 * Projects/Electives preserve their enabled defaults. Placements stays
 * opt-in until the owner approves a different rollout policy. */
export const OPTIONAL_MODULE_DEFAULT_POLICY = {
  projects: "ENABLED_UNLESS_OVERRIDDEN",
  placements: "OPT_IN_UNTIL_APPROVED",
  electives: "ENABLED_UNLESS_OVERRIDDEN",
} as const satisfies Record<OptionalModuleKey,string>;

/** Expose the actual resolver defaults for read-only explanations. */
export function getOptionalModuleSourceDefault(
  module: OptionalModuleKey,
): boolean {
  return DEFAULTS[module];
}

/** Placements enablement follows the legacy college-or-broader policy.
 * Per-learner placement eligibility is separately managed by the TPO.
 * Projects and Electives retain the vNext membership-level overrides. */
export function isModuleScopeIgnored(
  module: OptionalModuleKey,
  scopeType: ModuleAccessScopeType,
): boolean {
  return module==="placements"&&
    (scopeType==="MEMBERSHIP"||scopeType==="SECTION"||
     scopeType==="COHORT"||scopeType==="PROGRAM"||scopeType==="DEPARTMENT");
}

function pairKey(
  scopeType: string,
  scopeId: string | null,
  module: string,
) {
  return `${scopeType}|${scopeId ?? ""}|${module}`;
}

export function resolveModuleAccessFromRules(
  chain: readonly ModuleAccessScope[],
  rules: readonly ModuleAccessRule[],
): OptionalModuleAccess {
  const byPair = new Map(
    rules.map((rule) => [
      pairKey(rule.scopeType, rule.scopeId, rule.module),
      rule,
    ]),
  );

  const resolveOne = (
    module: OptionalModuleKey,
  ): ModuleAccessResolution => {
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const scope = chain[index];
      if(isModuleScopeIgnored(module,scope.scopeType))continue;
      const rule = byPair.get(
        pairKey(scope.scopeType, scope.scopeId, module),
      );
      if (rule?.locked) {
        return {
          enabled: rule.enabled,
          level: scope.scopeType,
          scopeId: scope.scopeId,
          locked: true,
        };
      }
    }

    for (const scope of chain) {
      if(isModuleScopeIgnored(module,scope.scopeType))continue;
      const rule = byPair.get(
        pairKey(scope.scopeType, scope.scopeId, module),
      );
      if (rule) {
        return {
          enabled: rule.enabled,
          level: scope.scopeType,
          scopeId: scope.scopeId,
          locked: false,
        };
      }
    }

    return {
      enabled: DEFAULTS[module],
      level: "DEFAULT",
      scopeId: null,
      locked: false,
    };
  };

  return {
    projects: resolveOne("projects"),
    placements: resolveOne("placements"),
    electives: resolveOne("electives"),
  };
}

/** Read-only hierarchy explanation for module-access tree UIs.
 * A locked ancestor outranks a nearer unlocked rule; remaining stored rules
 * are shadowed rather than silently hidden. Placement eligibility/audience
 * is a separate learner-specific gate and is not implied by this result. */
export function explainOptionalModuleAccess(
  chain: readonly ModuleAccessScope[],
  rules: readonly ModuleAccessRule[],
): Record<OptionalModuleKey,{
  effective:ModuleAccessResolution;
  visibleRules:readonly (ModuleAccessRule&{legacyLevel:string;shadowed:boolean})[];
}> {
  const effective=resolveModuleAccessFromRules(chain,rules);
  const explain=(module:OptionalModuleKey)=>{
    const winner=effective[module];
    const visibleRules=chain.flatMap(scope=>{
      if(isModuleScopeIgnored(module,scope.scopeType))return [];
      const match=rules.find(rule=>rule.module===module&&
        rule.scopeType===scope.scopeType&&rule.scopeId===scope.scopeId);
      return match?[{...match,
        legacyLevel:LEGACY_SCOPE_NAME_BY_VNEXT[scope.scopeType],
        shadowed:!(winner.level===scope.scopeType&&winner.scopeId===scope.scopeId)}]:[];
    });
    return {effective:winner,visibleRules};
  };
  return {
    projects:explain("projects"),
    placements:explain("placements"),
    electives:explain("electives"),
  };
}

/** Old GET /api/v1/features/mine was wrapped in Response(status,message,data).
 * Endpoint adapters still enforce principal scope and learner eligibility. */
export function toLegacyModuleFlagsEnvelope(access:OptionalModuleAccess){
  const modules={
    projects:access.projects.enabled,
    placements:access.placements.enabled,
    electives:access.electives.enabled,
  };
  return {status:"OK" as const,message:"OK" as const,data:{
    projectsEnabled:modules.projects,placementsEnabled:modules.placements,modules,
  }};
}

function pushScope(
  chain: ModuleAccessScope[],
  scopeType: ModuleAccessScopeType,
  scopeId: string | null | undefined,
) {
  if (scopeType !== "GLOBAL" && !scopeId) return;
  if (
    chain.some(
      (item) =>
        item.scopeType === scopeType &&
        item.scopeId === (scopeId ?? null),
    )
  ) {
    return;
  }
  chain.push({ scopeType, scopeId: scopeId ?? null });
}

export async function buildModuleAccessChain(
  context: RequestContext,
): Promise<ModuleAccessScope[]> {
  const chain: ModuleAccessScope[] = [];
  const membership = context.membership;

  if (membership && hasMembershipRole(context, "LEARNER")) {
    pushScope(chain, "MEMBERSHIP", membership.id);

    const db = getDb();
    const [enrollment] = await db
      .select({
        id: learnerProgramEnrollments.id,
        programId: learnerProgramEnrollments.programId,
        cohortId: learnerProgramEnrollments.cohortId,
      })
      .from(learnerProgramEnrollments)
      .where(
        and(
          eq(learnerProgramEnrollments.membershipId, membership.id),
          eq(learnerProgramEnrollments.status, "ACTIVE"),
        ),
      )
      .limit(1);

    let sectionId: string | null = null;
    let cohortId: string | null = enrollment?.cohortId ?? null;
    let programId: string | null = enrollment?.programId ?? null;

    if (enrollment) {
      const [section] = await db
        .select({
          sectionId: sectionEnrollments.sectionId,
          cohortId: sections.cohortId,
        })
        .from(sectionEnrollments)
        .innerJoin(
          sections,
          eq(sections.id, sectionEnrollments.sectionId),
        )
        .where(
          and(
            eq(
              sectionEnrollments.learnerEnrollmentId,
              enrollment.id,
            ),
            eq(sectionEnrollments.status, "ACTIVE"),
          ),
        )
        .limit(1);

      if (section) {
        sectionId = section.sectionId;
        cohortId = section.cohortId;
      }
    }

    if (cohortId) {
      const [cohort] = await db
        .select({ programId: cohorts.programId })
        .from(cohorts)
        .where(eq(cohorts.id, cohortId))
        .limit(1);
      if (cohort) programId = cohort.programId;
    }

    let departmentId: string | null = null;
    if (programId) {
      const [program] = await db
        .select({ departmentId: programs.departmentId })
        .from(programs)
        .where(eq(programs.id, programId))
        .limit(1);
      departmentId = program?.departmentId ?? null;
    }

    let foreignOrMissingDepartment = false;
    if (departmentId) {
      const [department] = await db
        .select({ collegeId: departments.collegeId })
        .from(departments)
        .where(eq(departments.id, departmentId))
        .limit(1);

      foreignOrMissingDepartment =
        !department || department.collegeId !== membership.collegeId;
    }

    // Do not inherit foreign-college or orphaned academic scopes.
    // Keeping the fallback at the scope boundary also avoids misleading
    // type narrowing from attempted null assignments inside nested branches.
    pushScope(chain, "SECTION", foreignOrMissingDepartment ? null : sectionId);
    pushScope(chain, "COHORT", foreignOrMissingDepartment ? null : cohortId);
    pushScope(chain, "PROGRAM", foreignOrMissingDepartment ? null : programId);
    pushScope(chain, "DEPARTMENT", foreignOrMissingDepartment ? null : departmentId);
  }

  const collegeId =
    membership?.collegeId ?? context.adminScope?.collegeId ?? null;
  const organizationId =
    membership?.organizationId ??
    context.adminScope?.organizationId ??
    null;

  pushScope(chain, "COLLEGE", collegeId);
  pushScope(chain, "ORGANIZATION", organizationId);
  pushScope(chain, "GLOBAL", null);

  return chain;
}

export async function resolveOptionalModuleAccessForChain(
  chain: readonly ModuleAccessScope[],
): Promise<OptionalModuleAccess> {
  const ids = chain
    .map((scope) => scope.scopeId)
    .filter((value): value is string => value !== null);

  const scopeCondition =
    ids.length > 0
      ? or(
          isNull(moduleAccessRules.scopeId),
          inArray(moduleAccessRules.scopeId, ids),
        )
      : isNull(moduleAccessRules.scopeId);

  const rules = await getDb()
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
        scopeCondition,
      ),
    );

  return resolveModuleAccessFromRules(chain, rules);
}

export async function resolveOptionalModuleAccess(
  context: RequestContext,
) {
  const chain = await buildModuleAccessChain(context);
  return resolveOptionalModuleAccessForChain(chain);
}
