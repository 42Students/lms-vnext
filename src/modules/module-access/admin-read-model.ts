import {
  OPTIONAL_MODULE_KEYS,
  resolveModuleAccessFromRules,
  type ModuleAccessRule,
  type OptionalModuleKey,
} from "./service";

export const ADMIN_MODULE_LABELS: Record<
  OptionalModuleKey,
  string
> = {
  projects: "Projects",
  placements: "Placements",
  electives: "Electives",
};

export type AdminModuleDecision = {
  module: OptionalModuleKey;
  label: string;
  enabled: boolean;
  source: "PERSISTED" | "SOURCE_DEFAULT";
  level: string;
  locked: boolean;
};

export function resolveCollegeModuleDecisions(
  collegeId: string,
  organizationId: string,
  rules: readonly ModuleAccessRule[],
): AdminModuleDecision[] {
  const resolved = resolveModuleAccessFromRules(
    [
      {
        scopeType: "COLLEGE",
        scopeId: collegeId,
      },
      {
        scopeType: "ORGANIZATION",
        scopeId: organizationId,
      },
      {
        scopeType: "GLOBAL",
        scopeId: null,
      },
    ],
    rules,
  );

  return OPTIONAL_MODULE_KEYS.map((module) => {
    const decision = resolved[module];

    return {
      module,
      label: ADMIN_MODULE_LABELS[module],
      enabled: decision.enabled,
      source:
        decision.level === "DEFAULT"
          ? "SOURCE_DEFAULT"
          : "PERSISTED",
      level: decision.level,
      locked: decision.locked,
    };
  });
}

export function describeModuleDecision(
  decision: Pick<
    AdminModuleDecision,
    "source" | "level" | "locked"
  >,
): string {
  if (decision.source === "SOURCE_DEFAULT") {
    return "Source default";
  }

  return [
    `Persisted ${decision.level.toLowerCase()} rule`,
    ...(decision.locked ? ["locked"] : []),
  ].join(" · ");
}

export function adminFeaturesHref(filters: {
  q?: string;
  page?: number;
  sort?: "NAME"|"CODE";
  module?: "projects"|"placements"|"electives";
  storedState?: "ALL"|"ON"|"OFF";
}): string {
  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.sort === "CODE") params.set("sort", "CODE");
  if (filters.module) params.set("module", filters.module);
  if (filters.storedState && filters.storedState !== "ALL") params.set("storedState", filters.storedState);

  const query = params.toString();

  return query
    ? `/admin/features?${query}`
    : "/admin/features";
}

export const MODULE_SCOPE_LABELS = {
  GLOBAL: "Global",
  ORGANIZATION: "Organization",
  COLLEGE: "College",
  DEPARTMENT: "Department",
  PROGRAM: "Program",
  COHORT: "Cohort / batch",
  SECTION: "Section / class",
  MEMBERSHIP: "Learner membership",
} as const;

export function describeStoredOverride(input: {
  enabled: boolean;
  locked: boolean;
}): string {
  return [
    input.enabled ? "On" : "Off",
    ...(input.locked ? ["Locked"] : []),
  ].join(" · ");
}

/** Summarizes only the fetched college row, never extrapolates to learner access. */
export function collegeModuleCardSummary(
 modules: readonly Pick<AdminModuleDecision,"enabled"|"source"|"locked">[],
) {
 return {
  enabled: modules.filter(x=>x.enabled).length,
  disabled: modules.filter(x=>!x.enabled).length,
  locked: modules.filter(x=>x.locked).length,
  persisted: modules.filter(x=>x.source==="PERSISTED").length,
 };
}

/** Describes stored lower-level overrides without claiming effective learner access. */
export function summarizeStoredModuleOverrides(items:readonly {enabled:boolean;locked:boolean}[]) {
 return {rules:items.length,enabled:items.filter(x=>x.enabled).length,locked:items.filter(x=>x.locked).length};
}
