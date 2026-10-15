import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ADMIN_MODULE_LABELS,
  adminFeaturesHref,
  adminFeatureExportHref,
  adminFeatureHierarchyHref,
  describeModuleDecision,
  collegeModuleCardSummary,
  type AdminModuleDecision,
} from "@/modules/module-access/admin-read-model";
import {listSuperAdminFeatureControls} from "@/modules/module-access/admin-read-service";
import {parseAdminFeaturePageParams} from "@/modules/module-access/admin-feature-query";
import { OPTIONAL_MODULE_KEYS } from "@/modules/module-access/service";
import { placementFeatureEffects } from "@/modules/platform-settings/placement-feature-controls-model";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

 function ModuleState({
  decision,
}: {
  decision: AdminModuleDecision;
}) {
  return (
    <div className="space-y-1.5">
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
      <p className="m-0 text-xs leading-5 text-muted-foreground">
        {describeModuleDecision(decision)}
      </p>
      {decision.module === "placements" && !decision.enabled ? (
        <p className="m-0 text-xs leading-5 text-muted-foreground">
          Placement policy: {placementFeatureEffects(false).impact} This is a policy explanation, not confirmation that every downstream screen is enforced.
        </p>
      ) : null}
    </div>
  );
}

export default async function SuperAdminFeaturesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  const params = await searchParams;
  const parsed = parseAdminFeaturePageParams(params);

  if (!parsed) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin · Tenant Controls"
          title="Feature Controls"
          description="Read-only college module access."
        />
        <ErrorState
          title="Invalid feature filters"
          description="The search or page number is invalid. No college module settings were loaded."
          action={
            <Link
              href="/admin/features"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const result =
    await listSuperAdminFeatureControls(
      context,
      parsed,
    );

  const firstItem =
    result.total === 0
      ? 0
      : (result.page - 1) *
          result.pageSize +
        1;

  const lastItem = Math.min(
    result.total,
    result.page * result.pageSize,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Controls"
        title="Feature Controls"
        description="Effective college-level access for the three optional modules configured in vNext: Projects, Placements and Electives. Values are resolved using the existing persisted-rule inheritance and source defaults."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <form
          action="/admin/features"
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          <label className="grid min-w-60 flex-1 gap-2 text-sm font-semibold text-body">
            Find college
            <input
              name="q"
              type="search"
              maxLength={100}
              defaultValue={result.q}
              placeholder="College name or code"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Sort colleges
            <select name="sort" defaultValue={result.sort} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="NAME">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="CODE">Code A–Z</option><option value="CODE_DESC">Code Z–A</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Explicit college rule for
            <select name="module" defaultValue={result.moduleFilter ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">Any college</option><option value="projects">Projects</option><option value="placements">Placements</option><option value="electives">Electives</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Stored college value
            <select name="storedState" defaultValue={result.stateFilter} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any value</option><option value="ON">Stored On</option><option value="OFF">Stored Off</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">College rule lock
            <select name="locks" defaultValue={result.lockFilter} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any lock</option><option value="LOCKED">Stored locked only</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">College rule presence
            <select name="presence" defaultValue={result.presenceFilter} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ANY">Any college</option><option value="HAS_RULE">Has stored rule</option><option value="NO_RULE">No stored rule</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Stored rule last updated
            <select name="recent" defaultValue={result.recentFilter} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any date</option><option value="7D">Last 7 days</option><option value="30D">Last 30 days</option><option value="90D">Last 90 days</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Search in
            <select name="searchField" defaultValue={result.searchField} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Name and code</option><option value="NAME">College name</option><option value="CODE">College code</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Search
          </button>
          <Link
            href="/admin/features"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Clear
          </Link>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            College module matrix
          </h2>
          <Link href={adminFeatureExportHref({
            q:result.q,page:result.page,sort:result.sort,module:result.moduleFilter??undefined,
            storedState:result.stateFilter,locks:result.lockFilter,presence:result.presenceFilter,
            recent:result.recentFilter,searchField:result.searchField,
          })} className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
            Export current page (CSV)
          </Link>
          <p className="m-0 text-sm text-muted-foreground">
            {result.total === 0
              ? "No matching active colleges"
              : firstItem > result.total
                ? "Page outside the result range"
                : `${firstItem}–${lastItem} of ${result.total} active colleges`}
          </p>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            title="No colleges on this page"
            description="No active colleges match the current search and selected Super Admin scope. Check the filters or return to the first page."
          />
        ) : (
          <>
          <div className="grid gap-3 lg:hidden" aria-label="College module cards">
            {result.items.map(college => {
              const summary = collegeModuleCardSummary(college.modules);
              return <article key={college.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="m-0 break-words font-semibold text-foreground">{college.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{college.code}</p>
                  </div>
                  <StatusBadge>{summary.enabled} of {college.modules.length} enabled</StatusBadge>
                </div>
                <dl className="mt-4 space-y-3">
                  {college.modules.map(decision => (
                    <div key={decision.module} className="flex flex-wrap items-start justify-between gap-2 border-t border-border pt-3">
                      <dt className="text-sm font-semibold text-foreground">{decision.label}</dt>
                      <dd className="m-0 text-right"><ModuleState decision={decision}/></dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  {summary.locked} locked · {summary.persisted} rules with persisted source
                </p>
                <Link href={adminFeatureHierarchyHref(college.id,result.moduleFilter)}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">
                  View access hierarchy →
                </Link>
              </article>;
            })}
          </div>
          <div className="hidden rounded-xl border border-border bg-surface lg:block">

            <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
              <thead className="bg-muted text-body">
                <tr>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    College
                  </th>
                  {OPTIONAL_MODULE_KEYS.map(
                    (module) => (
                      <th
                        key={module}
                        scope="col"
                        className="border-b border-border px-4 py-3"
                      >
                        {ADMIN_MODULE_LABELS[module]}
                      </th>
                    ),
                  )}
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Module Access
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map(
                  (college) => (
                    <tr
                      key={college.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="m-0 font-semibold text-foreground">
                          {college.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {college.code}
                        </p>
                      </td>

                      {college.modules.map(
                        (decision) => (
                          <td
                            key={decision.module}
                            className="px-4 py-4 align-top"
                          >
                            <ModuleState
                              decision={decision}
                            />
                          </td>
                        ),
                      )}

                      <td className="px-4 py-4 align-top">
                        <Link
                          href={adminFeatureHierarchyHref(college.id,result.moduleFilter)}
                          className="font-semibold text-primary-text hover:underline"
                        >
                          View hierarchy →
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        <nav
          aria-label="Feature Controls pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={adminFeaturesHref({
                  q: result.q,
                  sort: result.sort,
                  module: result.moduleFilter ?? undefined,
                  storedState: result.stateFilter,
                  locks: result.lockFilter,
                  presence: result.presenceFilter,
                  recent: result.recentFilter,
                  searchField: result.searchField,
                  page: result.page - 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                ← Previous
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                href={adminFeaturesHref({
                  q: result.q,
                  sort: result.sort,
                  module: result.moduleFilter ?? undefined,
                  storedState: result.stateFilter,
                  locks: result.lockFilter,
                  presence: result.presenceFilter,
                  recent: result.recentFilter,
                  searchField: result.searchField,
                  page: result.page + 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Filtering by module means the college has an explicit stored college-level rule for that module; it does not filter by each learner's effective access. The CSV includes only the current permissioned page (up to 20 colleges) and excludes contacts. Source: module_access_rules and the existing
        optional-module resolver. A persisted global,
        organization or college rule can override the
        source defaults. This matrix shows college-level
        access, not the access of every individual learner.
        Lower-level Projects/Electives overrides,
        placement participation decisions, and other
        authorization gates may affect a learner&apos;s
        actual experience. No toggles or policy writes
        are available here.
      </p>
    </div>
  );
}
