import {
  getOptionalModuleSourceDefault,
  isModuleScopeIgnored,
  OPTIONAL_MODULE_KEYS,
  resolveModuleAccessFromRules,
  type ModuleAccessRule,
  type ModuleAccessScope,
  type ModuleAccessScopeType,
  type OptionalModuleKey,
} from "./service";
import {
  ADMIN_MODULE_LABELS,
} from "./admin-read-model";

export const MODULE_TRACE_LEVELS = [
  "MEMBERSHIP",
  "SECTION",
  "COHORT",
  "PROGRAM",
  "DEPARTMENT",
  "COLLEGE",
  "ORGANIZATION",
  "GLOBAL",
  "DEFAULT",
] as const;

export type ModuleTraceLevel =
  (typeof MODULE_TRACE_LEVELS)[number];

export type ModuleTraceStep = {
  level: ModuleTraceLevel;
  scopeId: string | null;
  inChain: boolean;
  value: boolean | null;
  locked: boolean;
  source: "PERSISTED" | "SOURCE_DEFAULT" | "NONE";
  ignored: boolean;
  winner: boolean;
  reason: string;
};

export type LearnerModuleTrace = {
  module: OptionalModuleKey;
  label: string;
  enabled: boolean;
  winnerLevel: ModuleAccessScopeType | "DEFAULT";
  winnerLocked: boolean;
  explanation: string;
  steps: ModuleTraceStep[];
};

export type ModuleTraceFilters = {
  q?: string;
  page?: number;
  membershipId?: string;
};

export function adminModuleTraceHref(
  collegeId: string,
  filters: ModuleTraceFilters = {},
): string {
  const base =
    `/admin/features/${encodeURIComponent(collegeId)}/trace`;

  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.membershipId) {
    params.set("membershipId", filters.membershipId);
  }

  const query = params.toString();

  return query ? `${base}?${query}` : base;
}

function ruleAtScope(
  rules: readonly ModuleAccessRule[],
  module: OptionalModuleKey,
  scope: ModuleAccessScope,
): ModuleAccessRule | undefined {
  return rules.find(
    (rule) =>
      rule.module === module &&
      rule.scopeType === scope.scopeType &&
      rule.scopeId === scope.scopeId,
  );
}

function winningExplanation(
  level: ModuleAccessScopeType | "DEFAULT",
  locked: boolean,
): string {
  if (level === "DEFAULT") {
    return (
      "No applicable persisted rule was selected. " +
      "The module's existing source default determines the result."
    );
  }

  if (locked) {
    return (
      `The ${level.toLowerCase()} rule wins because it is ` +
      "the broadest applicable locked rule. The resolver " +
      "evaluates locks before normal inheritance."
    );
  }

  return (
    `No applicable locked rule takes precedence. ` +
    `The ${level.toLowerCase()} rule is the most-specific ` +
    "persisted rule in the learner's current chain."
  );
}

/**
 * Explain, but never independently decide, module access.
 *
 * The final enabled state, chosen level and lock result
 * are obtained from resolveModuleAccessFromRules.
 * Scope applicability and fallback values also come
 * from the production module-access service.
 *
 * Missing academic levels remain visible as "not in
 * chain", rather than appearing to contain an override.
 */
export function explainLearnerModuleAccess(
  chain: readonly ModuleAccessScope[],
  rules: readonly ModuleAccessRule[],
): LearnerModuleTrace[] {
  const resolved =
    resolveModuleAccessFromRules(chain, rules);

  return OPTIONAL_MODULE_KEYS.map((module) => {
    const chosen = resolved[module];
    const explanation = winningExplanation(
      chosen.level,
      chosen.locked,
    );

    const steps: ModuleTraceStep[] =
      MODULE_TRACE_LEVELS.map((level) => {
        if (level === "DEFAULT") {
          const winner =
            chosen.level === "DEFAULT";

          return {
            level,
            scopeId: null,
            inChain: true,
            value: getOptionalModuleSourceDefault(module),
            locked: false,
            source: "SOURCE_DEFAULT" as const,
            ignored: false,
            winner,
            reason: winner
              ? "Winner: no applicable persisted rule; source fallback is used."
              : "Fallback is not used because a persisted rule won.",
          };
        }

        const scope = chain.find(
          (item) =>
            item.scopeType === level,
        );

        if (!scope) {
          return {
            level,
            scopeId: null,
            inChain: false,
            value: null,
            locked: false,
            source: "NONE" as const,
            ignored: false,
            winner: false,
            reason:
              "This scope is not present in the learner's current resolution chain.",
          };
        }

        const stored = ruleAtScope(
          rules,
          module,
          scope,
        );

        const ignored =
          isModuleScopeIgnored(
            module,
            scope.scopeType,
          );

        const winner =
          !ignored &&
          chosen.level === scope.scopeType &&
          chosen.scopeId === scope.scopeId;

        let reason: string;

        if (ignored) {
          reason = stored
            ? "Stored rule ignored: Placements does not resolve below College scope."
            : "This scope is ignored for Placements; no stored rule is present.";
        } else if (!stored) {
          reason =
            "No persisted rule at this level; inherit from the next applicable scope.";
        } else if (winner) {
          reason = explanation;
        } else if (chosen.locked) {
          reason =
            "Not selected: an applicable locked rule takes precedence.";
        } else if (
          chosen.level !== "DEFAULT"
        ) {
          reason =
            "Not selected: a more-specific applicable persisted rule takes precedence.";
        } else {
          reason =
            "Not selected: the source default determines the result.";
        }

        return {
          level,
          scopeId: scope.scopeId,
          inChain: true,
          value: stored?.enabled ?? null,
          locked: stored?.locked ?? false,
          source: stored
            ? ("PERSISTED" as const)
            : ("NONE" as const),
          ignored,
          winner,
          reason,
        };
      });

    return {
      module,
      label: ADMIN_MODULE_LABELS[module],
      enabled: chosen.enabled,
      winnerLevel: chosen.level,
      winnerLocked: chosen.locked,
      explanation,
      steps,
    };
  });
}

/** Distinguish a stored membership rule from the effective resolution result. */
export function membershipOverrideSummary(modules:readonly LearnerModuleTrace[]) {
 return modules.map(item=>{
  const membership=item.steps.find(step=>step.level==="MEMBERSHIP");
  return {module:item.module,label:item.label,
   stored:membership?.source==="PERSISTED"?membership.value:null,
   locked:membership?.source==="PERSISTED"&&membership.locked===true,
   ignored:membership?.ignored===true,
   winner:membership?.winner===true,
  };
 });
}
