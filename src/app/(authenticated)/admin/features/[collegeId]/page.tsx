import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { collegeIdSchema } from "@/modules/colleges/validation";
import {
  ADMIN_MODULE_LABELS,
  MODULE_SCOPE_LABELS,
  describeModuleDecision,
  describeStoredOverride,
  summarizeStoredModuleOverrides,
} from "@/modules/module-access/admin-read-model";
import {
  getSuperAdminCollegeModuleAccess,
} from "@/modules/module-access/admin-read-service";
import { OPTIONAL_MODULE_KEYS } from "@/modules/module-access/service";
import {placementFeatureEffects} from "@/modules/platform-settings/placement-feature-controls-model";

type SearchParams = {
  page?: string | string[];
  module?: string | string[];
  scope?: string | string[];
  locks?: string | string[];
  storedState?: string | string[];
};

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function SuperAdminCollegeModuleAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ collegeId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { collegeId } = await params;

  if (!collegeIdSchema.safeParse(collegeId).success) {
    notFound();
  }

  const query = await searchParams;
  if (Array.isArray(query.module) || Array.isArray(query.scope) || Array.isArray(query.locks) || Array.isArray(query.storedState)) notFound();
  const context = await getCurrentRequestContext();

  const result = await getSuperAdminCollegeModuleAccess(
    context,
    collegeId,
    {
      page: one(query.page) || undefined,
      module: one(query.module) || undefined,
      scope: one(query.scope) || undefined,
      locks: one(query.locks) || undefined,
      storedState: one(query.storedState) || undefined,
    },
  );

  if (!result) {
    notFound();
  }

  const { college, modules, ancestors } = result;
  const ancestorLevels = [
    "GLOBAL",
    "ORGANIZATION",
    "COLLEGE",
  ] as const;

  function ancestorRule(
    level: string,
    module: string,
  ) {
    return ancestors.find(
      (rule) =>
        rule.scopeType === level &&
        rule.module === module,
    );
  }

  const pageHref = (page: number) => {
    const base =
      `/admin/features/${encodeURIComponent(college.id)}`;

    const parts = new URLSearchParams();
    if (result.moduleFilter) parts.set("module", result.moduleFilter);
    if (result.scopeFilter) parts.set("scope", result.scopeFilter);
    if (result.lockFilter === "LOCKED") parts.set("locks", "LOCKED");
    if (result.stateFilter !== "ALL") parts.set("storedState", result.stateFilter);
    if (page > 1) parts.set("page", String(page));
    return base + (parts.size ? "?" + parts.toString() : "");
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/features"
        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Feature Controls
      </Link>

      <PageHeader
        eyebrow="Super Admin · Module Access"
        title={`${college.name} · Access hierarchy`}
        description={`Read-only persisted module rules for college ${college.code}. Stored overrides may be inherited or masked by higher-priority locked rules.`}
      />

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              Why this learner sees a module
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              Find an active learner in this college and trace the
              module-access decision through membership, academic
              scopes, college, organization, global rules and defaults.
            </p>
          </div>
          <Link
            href={`/admin/features/${encodeURIComponent(college.id)}/trace`}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
          >
            Open learner access trace →
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {modules.map((decision) => (
          <article
            key={decision.module}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <h2 className="m-0 text-sm font-semibold text-foreground">
              {decision.label}
            </h2>
            <div className="mt-3">
              <StatusBadge
                tone={
                  decision.enabled
                    ? "success"
                    : "neutral"
                }
              >
                {decision.enabled
                  ? "Enabled"
                  : "Disabled"}
              </StatusBadge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {describeModuleDecision(decision)}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5" aria-label="Placements college access impact">
        <h2 className="text-base font-semibold text-foreground">Placements: college-level access impact</h2>
        {modules.filter(decision=>decision.module==="placements").map(decision=>(
          <div key={decision.module} className="mt-3 space-y-2 text-sm text-body">
            <p>Effective policy in {college.name}: <strong>{decision.enabled?"On":"Off"}</strong></p>
            <p>{placementFeatureEffects(decision.enabled).impact}</p>
            <p className="text-xs text-muted-foreground">Placements ignores Department, Program, Cohort, Section and Membership overrides. This preview describes the policy result, not runtime proof of every downstream route.</p>
            <p className="text-xs text-muted-foreground">Turning access off does not delete historical jobs, applications or learner placement records.</p>
          </div>
        ))}
      </section>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4" aria-label="Filter stored module overrides">
        <label className="grid gap-1 text-sm font-semibold text-body">Stored descendant module
          <select name="module" defaultValue={result.moduleFilter ?? ""} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="">All modules</option>
            {OPTIONAL_MODULE_KEYS.map(key => <option key={key} value={key}>{ADMIN_MODULE_LABELS[key]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Stored scope
          <select name="scope" defaultValue={result.scopeFilter ?? ""} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="">All descendant scopes</option>
            {(["DEPARTMENT","PROGRAM","COHORT","SECTION","MEMBERSHIP"] as const).map(key =>
              <option key={key} value={key}>{MODULE_SCOPE_LABELS[key]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Lock state
          <select name="locks" defaultValue={result.lockFilter} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="ALL">All stored rules</option><option value="LOCKED">Locked rules only</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Stored value
          <select name="storedState" defaultValue={result.stateFilter} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="ALL">Any stored value</option><option value="ON">Stored On</option><option value="OFF">Stored Off</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter overrides</button>
        <Link href={"/admin/features/" + encodeURIComponent(college.id)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Reset</Link>
      </form>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            College inheritance
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            These are the actual stored rules at
            global, organization and college scope.
            “Inherit” means no rule exists at that
            particular level. The effective status
            above uses the production module resolver,
            including ancestor locks.
          </p>
        </div>

        <>
        <div className="grid gap-3 lg:hidden" aria-label="College module inheritance cards">
          {OPTIONAL_MODULE_KEYS.map(moduleKey => {
            const effective = modules.find(value => value.module === moduleKey);
            return <article key={moduleKey} className="min-w-0 rounded-xl border border-border bg-surface p-4">
              <h3 className="m-0 break-words text-base font-semibold text-foreground">{ADMIN_MODULE_LABELS[moduleKey]}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                {ancestorLevels.map(level => {
                  const stored=ancestorRule(level,moduleKey);
                  return <div key={level} className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
                    <dt className="text-body">{MODULE_SCOPE_LABELS[level]}</dt>
                    <dd className="font-semibold text-foreground">{stored?describeStoredOverride(stored):"Inherit"}</dd>
                  </div>;
                })}
                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
                  <dt className="font-semibold text-body">Effective at college</dt>
                  <dd className="font-semibold text-foreground">{effective?effective.enabled?"On":"Off":"Unavailable"}</dd>
                </div>
              </dl>
            </article>;
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
          <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
            <thead className="bg-muted text-body">
              <tr>
                <th
                  scope="col"
                  className="border-b border-border px-4 py-3"
                >
                  Module
                </th>
                {ancestorLevels.map((level) => (
                  <th
                    scope="col"
                    key={level}
                    className="border-b border-border px-4 py-3"
                  >
                    {MODULE_SCOPE_LABELS[level]}
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-b border-border px-4 py-3"
                >
                  Effective at college
                </th>
              </tr>
            </thead>
            <tbody>
              {OPTIONAL_MODULE_KEYS.map((module) => {
                const effective = modules.find(
                  (value) => value.module === module,
                );

                return (
                  <tr
                    key={module}
                    className="border-b border-border last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="px-4 py-4 text-left font-semibold text-foreground"
                    >
                      {ADMIN_MODULE_LABELS[module]}
                    </th>

                    {ancestorLevels.map((level) => {
                      const stored = ancestorRule(
                        level,
                        module,
                      );

                      return (
                        <td
                          key={level}
                          className="px-4 py-4 text-body"
                        >
                          {stored ? (
                            <span
                              className="font-semibold"
                            >
                              {describeStoredOverride(
                                stored,
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Inherit
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-4 py-4 text-body">
                      {effective ? (
                        <span className="font-semibold">
                          {effective.enabled
                            ? "On"
                            : "Off"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Persisted lower-level overrides
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            This page contains {summarizeStoredModuleOverrides(result.descendants).rules} visible stored override rows,
            including {summarizeStoredModuleOverrides(result.descendants).locked} locked rules.
            Counts are for this page only.
          </p>
          <p className="mt-1 text-sm leading-6 text-body">
            Stored rules on departments, programs,
            cohorts, sections and memberships belonging
            to this college. These are configured values,
            not independently evaluated learner access.
            Placements ignores rules below college scope.
          </p>
        </div>

        {result.descendants.length === 0 ? (
          <EmptyState
            title={
              result.total === 0
                ? "No lower-level overrides"
                : "No overrides on this page"
            }
            description={
              result.total === 0
                ? "No persisted department, program, cohort, section or membership rules were found for this college. Access continues to follow the higher-level rules and source defaults."
                : "The requested page is outside the available override range."
            }
          />
        ) : (
            <>
          <div className="grid gap-3 lg:hidden" aria-label="Stored descendant rule cards">
            {result.descendants.map(item => (
              <article key={`${item.scopeType}:${item.scopeId}:${item.module}`}
                className="min-w-0 rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="m-0 break-words text-sm font-semibold text-foreground">
                    {ADMIN_MODULE_LABELS[item.module as keyof typeof ADMIN_MODULE_LABELS]??item.module}
                  </h3>
                  <StatusBadge tone={item.enabled?"success":"neutral"}>{describeStoredOverride(item)}</StatusBadge>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  {MODULE_SCOPE_LABELS[item.scopeType as keyof typeof MODULE_SCOPE_LABELS]??item.scopeType}
                </p>
                <p className="mt-1 break-words text-sm text-body">{item.scopeLabel}</p>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead className="bg-muted text-body">
                <tr>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Scope
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Academic path / membership
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Module
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Stored rule
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.descendants.map((item) => (
                  <tr
                    key={`${item.scopeType}:${item.scopeId}:${item.module}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 text-body">
                      {MODULE_SCOPE_LABELS[
                        item.scopeType as keyof typeof MODULE_SCOPE_LABELS
                      ] ?? item.scopeType}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {item.scopeLabel}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {ADMIN_MODULE_LABELS[
                        item.module as keyof typeof ADMIN_MODULE_LABELS
                      ] ?? item.module}
                    </td>
                    <td className="px-4 py-3 text-body">
                      <StatusBadge
                        tone={
                          item.enabled
                            ? "success"
                            : "neutral"
                        }
                      >
                        {describeStoredOverride(
                          item,
                        )}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <nav
          aria-label="Module overrides pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            {result.total} stored overrides ·
            page {result.page} of {result.totalPages}
          </p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={pageHref(result.page - 1)}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
              >
                ← Previous
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                href={pageHref(result.page + 1)}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        The college matrix and this hierarchy are read-only.
        A lower-level configured override is not necessarily
        effective: a locked ancestor can take precedence.
        Individual learner evaluation also requires current
        enrollment, role and participation checks.
        Membership IDs are shortened in the display;
        no contact details are loaded. Missing academic
        nodes without stored overrides are not enumerated.
        Editing, bulk changes, override drawers and
        exact legacy in-page access-trace interactions
        remain outside this partial implementation.
      </p>
    </div>
  );
}
