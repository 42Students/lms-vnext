import "server-only";

import {
  and,
  asc,
  desc,
  count,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  colleges,
  moduleAccessRules,
} from "@/db/schema";
import {
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  collegeIdSchema,
} from "@/modules/colleges/validation";

import {
  resolveCollegeModuleDecisions,
} from "./admin-read-model";
import type {
  ModuleAccessRule,
} from "./service";
import {adminModuleDetailQuerySchema} from "./admin-module-detail-query";

export {adminFeatureQuerySchema} from "./admin-feature-query";
import {adminFeatureQuerySchema,featureRuleCutoff,boundedAdminFeaturePage} from "./admin-feature-query";



const OVERRIDE_PAGE_SIZE = 30;

function requireSuperAdmin(
  context: RequestContext,
) {
  if (!isSuperAdmin(context)) {
    throw new AuthorizationError(
      "admin-scope.select",
    );
  }

  requirePermission(
    context,
    "admin-scope.select",
  );
}

type CollegeForAccess = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: string;
  legacyCollegeId?:number|null;
};

/**
 * Return ONLY rules relevant to the selected
 * colleges, their organizations, or GLOBAL scope.
 * The resolver consumes exact scope-type / scope-ID
 * pairs, so it cannot mistake a foreign scope ID
 * for a selected college's rule.
 */
async function loadCollegeAncestorRules(
  collegeRows: readonly CollegeForAccess[],
): Promise<ModuleAccessRule[]> {
  if (collegeRows.length === 0) {
    return [];
  }

  const collegeIds = collegeRows.map(
    (college) => college.id,
  );
  const organizationIds = [
    ...new Set(
      collegeRows.map(
        (college) => college.organizationId,
      ),
    ),
  ];

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
      or(
        and(
          eq(moduleAccessRules.scopeType, "COLLEGE"),
          inArray(
            moduleAccessRules.scopeId,
            collegeIds,
          ),
        ),
        and(
          eq(
            moduleAccessRules.scopeType,
            "ORGANIZATION",
          ),
          inArray(
            moduleAccessRules.scopeId,
            organizationIds,
          ),
        ),
        and(
          eq(moduleAccessRules.scopeType, "GLOBAL"),
          isNull(moduleAccessRules.scopeId),
        ),
      ),
    );
}

/**
 * Search and pagination are applied at the database,
 * always inside the selected Super Admin safety scope.
 * No caller-provided college or organization override
 * is accepted.
 */
export async function listSuperAdminFeatureControls(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  requireSuperAdmin(context);

  const query =
    adminFeatureQuerySchema.parse(rawQuery);
  const collegePageSize=query.pageSize;

  const conditions: SQL[] = [
    eq(colleges.status, "ACTIVE"),
  ];

  if (context.adminScope?.collegeId) {
    conditions.push(
      eq(
        colleges.id,
        context.adminScope.collegeId,
      ),
    );
  }

  if (context.adminScope?.organizationId) {
    conditions.push(
      eq(
        colleges.organizationId,
        context.adminScope.organizationId,
      ),
    );
  }

  if (query.q) {
    // Escape LIKE wildcards: search is a literal substring, not a raw
    // operator pattern. ILIKE supports appropriate trigram indexes when
    // installed; never interpolate untrusted SQL into a raw expression.
    const needle=query.q.replace(/[\\%_]/g,"\\    const nameMatch=sql`position(lower(${query.q}) in lower(${colleges.name})) > 0`;
    const codeMatch=sql`position(lower(${query.q}) in lower(${colleges.code})) > 0`;
    conditions.push(query.searchField==="NAME"?nameMatch:query.searchField==="CODE"?codeMatch:sql`(${nameMatch} or ${codeMatch})`);");
    const pattern="%"+needle+"%";
    const nameMatch=ilike(colleges.name,pattern);
    const codeMatch=ilike(colleges.code,pattern);
    conditions.push(query.searchField==="NAME"?nameMatch:
      query.searchField==="CODE"?codeMatch:or(nameMatch,codeMatch)!);
  }

  const cutoff=featureRuleCutoff(query.recent,new Date());
  if (query.module || query.storedState !== "ALL" || query.locks === "LOCKED" || query.presence !== "ANY" || cutoff) {
    const matchRule=sql`exists (
      select 1 from module_access_rules rule
      where rule.scope_type = 'COLLEGE' and rule.scope_id = ${colleges.id}
      ${query.module ? sql`and rule.module::text = ${query.module}::text` : sql``}
      ${query.storedState !== "ALL" ? sql`and rule.enabled = ${query.storedState === "ON"}` : sql``}
      ${query.locks === "LOCKED" ? sql`and rule.locked = true` : sql``}
      ${cutoff ? sql`and rule.updated_at >= ${cutoff}` : sql``}
    )`;
    conditions.push(query.presence === "NO_RULE" ? sql`not (${matchRule})` : matchRule);
  }
  const where = and(...conditions);
  const db = getDb();

  const [totals] = await db.select({total:count()}).from(colleges).where(where);
  const total=totals?.total ?? 0;
  const effectivePage=boundedAdminFeaturePage(query.page,total,collegePageSize);
  const collegeRows=await db
    .select({
      id:colleges.id,
      organizationId:colleges.organizationId,
      name:colleges.name,
      code:colleges.code,
      status:colleges.status,
      legacyCollegeId:colleges.legacyCollegeId,
    })
    .from(colleges)
    .where(where)
    .orderBy(
      query.sort === "CODE" ? asc(colleges.code) : query.sort === "CODE_DESC" ? desc(colleges.code) : query.sort === "NAME_DESC" ? desc(colleges.name) : asc(colleges.name),
      asc(colleges.id),
    )
    .limit(collegePageSize)
    .offset((effectivePage-1)*collegePageSize);

  for (const college of collegeRows) {
    requirePermission(context, "college.read", {
      organizationId: college.organizationId,
      collegeId: college.id,
    });
  }

  const rules =
    await loadCollegeAncestorRules(collegeRows);

  // Overview totals must describe every matched, authorized college, not
  // just the 20 entries shown on the current matrix page. Resolve inherited
  // rules in bounded batches with the exact same scope and filter predicates.
  const scopeCounts = { shown: total, projectsOn: 0, placementsOn: 0 };
  // These counters must represent the full matching scope, not the
  // currently displayed page. Iterate in bounded database pages.
  const aggregateBatchSize = 200;
  for (let offset = 0; offset < total; offset += aggregateBatchSize) {
    const scoped = await db.select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      status: colleges.status,
      legacyCollegeId: colleges.legacyCollegeId,
    }).from(colleges).where(where).orderBy(asc(colleges.id))
      .limit(aggregateBatchSize).offset(offset);
    if (scoped.length === 0) break;
    const scopedRules = await loadCollegeAncestorRules(scoped);
    for (const college of scoped) {
      const decisions = resolveCollegeModuleDecisions(
        college.id, college.organizationId, scopedRules,
      );
      if (decisions.some((decision) => decision.module === "projects" && decision.enabled))
        scopeCounts.projectsOn += 1;
      if (decisions.some((decision) => decision.module === "placements" && decision.enabled))
        scopeCounts.placementsOn += 1;
    }
  }

  // Request-time Super Admin authority can be revoked while the college
  // directory and ancestor rules are loading. Reconstruct persisted system
  // roles and reapply the selected-scope fence before exposing those rows.
  await db.transaction(async tx=>{
    const persisted=await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
    for(const college of collegeRows){
      requirePermission(persisted,"college.read",{
        collegeId:college.id,organizationId:college.organizationId,
      });
    }
  });

  return {
    items: collegeRows.map((college) => ({
      id: college.id,
      name: college.name,
      code: college.code,
      legacyCollegeId:college.legacyCollegeId,
      modules: resolveCollegeModuleDecisions(
        college.id,
        college.organizationId,
        rules,
      ).map(decision=>{
        const own=rules.find(rule=>rule.scopeType==="COLLEGE"&&
          rule.scopeId===college.id&&rule.module===decision.module);
        const ancestorLocked=rules.some(rule=>rule.module===decision.module&&rule.locked&&(
          (rule.scopeType==="ORGANIZATION"&&rule.scopeId===college.organizationId)||
          (rule.scopeType==="GLOBAL"&&rule.scopeId===null)));
        return {...decision,
          stored:own?{enabled:own.enabled,locked:own.locked}:null,
          ancestorLocked};
      }),
    })),
    q: query.q,
    sort: query.sort,
    moduleFilter: query.module ?? null,
    stateFilter: query.storedState,
    lockFilter: query.locks,
    presenceFilter: query.presence,
    recentFilter: query.recent,
    searchField: query.searchField,
    page: effectivePage,
    pageSize: collegePageSize,
    range:{
      from:total?(effectivePage-1)*collegePageSize+1:0,
      to:Math.min(total,effectivePage*collegePageSize),
      total,
    },
    scopeCounts,
    total,
    totalPages: Math.max(
      1,
      Math.ceil(total / collegePageSize),
    ),
  };
}

export type StoredModuleOverride = {
  scopeType: string;
  scopeId: string;
  scopeLabel: string;
  module: string;
  enabled: boolean;
  locked: boolean;
};

/**
 * Stored descendant rules only. These are deliberately
 * not called "effective learner access" because that
 * additionally depends on the learner's current
 * enrollment, ancestor locks, participation gate and
 * the resolved runtime chain.
 *
 * Each UNION arm joins through its own tenant hierarchy.
 * No bare scope UUID is accepted as proof of college
 * ownership.
 */
function scopedDescendantRules(
  collegeId: string,
): SQL {
  return sql`
    select
      'DEPARTMENT'::text as scope_type,
      department.id::text as scope_id,
      department.name::text as scope_label,
      rule.module::text as module,
      rule.enabled as enabled,
      rule.locked as locked
    from module_access_rules rule
    inner join departments department
      on rule.scope_type = 'DEPARTMENT'
      and rule.scope_id = department.id
    where department.college_id = ${collegeId}

    union all

    select
      'PROGRAM'::text,
      program.id::text,
      concat(
        department.name,
        ' / ',
        program.name
      )::text,
      rule.module::text,
      rule.enabled,
      rule.locked
    from module_access_rules rule
    inner join programs program
      on rule.scope_type = 'PROGRAM'
      and rule.scope_id = program.id
    inner join departments department
      on department.id = program.department_id
    where department.college_id = ${collegeId}

    union all

    select
      'COHORT'::text,
      cohort.id::text,
      concat(
        department.name,
        ' / ',
        program.name,
        ' / ',
        cohort.name
      )::text,
      rule.module::text,
      rule.enabled,
      rule.locked
    from module_access_rules rule
    inner join cohorts cohort
      on rule.scope_type = 'COHORT'
      and rule.scope_id = cohort.id
    inner join programs program
      on program.id = cohort.program_id
    inner join departments department
      on department.id = program.department_id
    where department.college_id = ${collegeId}

    union all

    select
      'SECTION'::text,
      section.id::text,
      concat(
        department.name,
        ' / ',
        program.name,
        ' / ',
        cohort.name,
        ' / ',
        section.name
      )::text,
      rule.module::text,
      rule.enabled,
      rule.locked
    from module_access_rules rule
    inner join sections section
      on rule.scope_type = 'SECTION'
      and rule.scope_id = section.id
    inner join cohorts cohort
      on cohort.id = section.cohort_id
    inner join programs program
      on program.id = cohort.program_id
    inner join departments department
      on department.id = program.department_id
    where department.college_id = ${collegeId}

    union all

    select
      'MEMBERSHIP'::text,
      membership.id::text,
      concat(
        'Membership ending ',
        right(membership.id::text, 8)
      )::text,
      rule.module::text,
      rule.enabled,
      rule.locked
    from module_access_rules rule
    inner join college_memberships membership
      on rule.scope_type = 'MEMBERSHIP'
      and rule.scope_id = membership.id
    where membership.college_id = ${collegeId}
  `;
}

type OverrideCountRow = {
  total: number | string;
};

type OverrideQueryRow = {
  scopeType: string;
  scopeId: string;
  scopeLabel: string;
  module: string;
  enabled: boolean;
  locked: boolean;
};

export async function getSuperAdminCollegeModuleAccess(
  context: RequestContext,
  rawCollegeId: string,
  rawQuery: unknown = {},
) {
  requireSuperAdmin(context);

  const collegeId =
    collegeIdSchema.parse(rawCollegeId);
  const query = adminModuleDetailQuerySchema.parse(
    rawQuery,
  );

  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      status: colleges.status,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college) {
    return null;
  }

  requirePermission(context, "college.read", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const ancestors =
    await loadCollegeAncestorRules([college]);

  const descendantSql =
    scopedDescendantRules(college.id);

  const combinedConditions:SQL[]=[];
  if(query.module) combinedConditions.push(sql`module = ${query.module}::text`);
  if(query.scope) combinedConditions.push(sql`scope_type = ${query.scope}::text`);
  if(query.scopeId) combinedConditions.push(sql`scope_id = ${query.scopeId}::text`);
  if(query.locks === "LOCKED") combinedConditions.push(sql`locked = true`);
  if(query.storedState !== "ALL") combinedConditions.push(sql`enabled = ${query.storedState === "ON"}`);
  const descendantFilter = combinedConditions.length ? sql`where ${sql.join(combinedConditions,sql` and `)}` : sql``;
  const countResult = await db.execute<OverrideCountRow>(sql`
    with scoped as (${descendantSql})
    select count(*)::int as total
    from scoped
    ${descendantFilter}
  `);
  const total = Number(countResult.rows[0]?.total ?? 0);
  const effectivePage = boundedAdminFeaturePage(query.page,total,OVERRIDE_PAGE_SIZE);
  const overrideResult = await db.execute<OverrideQueryRow>(sql`
    with scoped as (${descendantSql})
    select
      scope_type as "scopeType",
      scope_id as "scopeId",
      scope_label as "scopeLabel",
      module,
      enabled,
      locked
    from scoped
    ${descendantFilter}
    order by
      case scope_type
        when 'DEPARTMENT' then 1
        when 'PROGRAM' then 2
        when 'COHORT' then 3
        when 'SECTION' then 4
        when 'MEMBERSHIP' then 5
        else 6
      end,
      scope_label,
      scope_id,
      module
    limit ${OVERRIDE_PAGE_SIZE}
    offset ${(effectivePage - 1) * OVERRIDE_PAGE_SIZE}
  `);

  // Do not reveal stored descendant overrides to a Super Admin whose role
  // or selected-college permission was withdrawn during the database reads.
  await db.transaction(async tx=>{
    const persisted=await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
    requirePermission(persisted,"college.read",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  });

  return {
    college: {
      id: college.id,
      name: college.name,
      code: college.code,
      status: college.status,
    },
    modules: resolveCollegeModuleDecisions(
      college.id,
      college.organizationId,
      ancestors,
    ),
    ancestors: ancestors.filter(
      (rule) =>
        (rule.scopeType === "GLOBAL" &&
          rule.scopeId === null) ||
        (rule.scopeType === "ORGANIZATION" &&
          rule.scopeId === college.organizationId) ||
        (rule.scopeType === "COLLEGE" &&
          rule.scopeId === college.id),
    ),
    descendants:
      overrideResult.rows as StoredModuleOverride[],
    page: effectivePage,
    moduleFilter: query.module ?? null,
    scopeFilter: query.scope ?? null,
    lockFilter: query.locks,
    stateFilter: query.storedState,
    scopeIdFilter: query.scopeId ?? null,
    pageSize: OVERRIDE_PAGE_SIZE,
    total,
    totalPages: Math.max(
      1,
      Math.ceil(total / OVERRIDE_PAGE_SIZE),
    ),
  };
}
