import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {CollegeFeatureRuleEditor} from "@/components/admin/college-feature-rule-editor";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
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
import {adminControlScopeTag,adminControlFeatureCounts} from "@/modules/module-access/admin-control-overview-model";

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
    <div className="min-w-0 space-y-1.5">
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
      <div className="min-w-0 space-y-6">
        <PageHeader
          eyebrow="Super Admin · Tenant Controls"
          title="Feature Controls"
          description="College module access, policy inheritance and guarded inline changes."
        />
        <ErrorState
          title="Invalid feature filters"
          description="The search or page number is invalid. No college module settings were loaded."
          action={
            <Link
              href="/admin/features"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
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

  const controlCounts=adminControlFeatureCounts(result.items);
  const scopeLabel=adminControlScopeTag(context.adminScope);

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
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Controls"
        title="Feature Controls"
        description="Effective college-level access for the three optional modules configured in vNext: Projects, Placements and Electives. Values are resolved using the existing persisted-rule inheritance and source defaults."
      />

      <section aria-label="Feature Controls overview" className="border-t border-border pt-5">
        <p className="text-sm font-semibold">Module availability · {scopeLabel}</p>
        <h2 className="mt-1 text-base font-semibold">Optional modules by college</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt>Colleges in scope</dt><dd className="font-semibold">{result.total} matching current filters</dd></div>
          <div><dt>Projects on</dt><dd className="font-semibold">{controlCounts.projectsOn} of {controlCounts.shown} on this page</dd></div>
          <div><dt>Placements on</dt><dd className="font-semibold">{controlCounts.placementsOn} of {controlCounts.shown} on this page</dd></div>
        </dl>
      </section>
      <section className="border-t border-border pt-5">
        <form
          action="/admin/features"
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          <label className="grid min-w-60 flex-1 gap-2 text-sm font-semibold text-body">
            Find college
            <Input
              name="q"
              type="search"
              maxLength={100}
              defaultValue={result.q}
              placeholder="College name or code"
              className="w-full"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Sort colleges
            <Select name="sort" defaultValue={result.sort} className="min-h-11 sm:min-h-9">
              <option value="NAME">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="CODE">Code A–Z</option><option value="CODE_DESC">Code Z–A</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Explicit college rule for
            <Select name="module" defaultValue={result.moduleFilter ?? ""} className="min-h-11 sm:min-h-9">
              <option value="">Any college</option><option value="projects">Projects</option><option value="placements">Placements</option><option value="electives">Electives</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Stored college value
            <Select name="storedState" defaultValue={result.stateFilter} className="min-h-11 sm:min-h-9">
              <option value="ALL">Any value</option><option value="ON">Stored On</option><option value="OFF">Stored Off</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">College rule lock
            <Select name="locks" defaultValue={result.lockFilter} className="min-h-11 sm:min-h-9">
              <option value="ALL">Any lock</option><option value="LOCKED">Stored locked only</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">College rule presence
            <Select name="presence" defaultValue={result.presenceFilter} className="min-h-11 sm:min-h-9">
              <option value="ANY">Any college</option><option value="HAS_RULE">Has stored rule</option><option value="NO_RULE">No stored rule</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Stored rule last updated
            <Select name="recent" defaultValue={result.recentFilter} className="min-h-11 sm:min-h-9">
              <option value="ALL">Any date</option><option value="7D">Last 7 days</option><option value="30D">Last 30 days</option><option value="90D">Last 90 days</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Search in
            <Select name="searchField" defaultValue={result.searchField} className="min-h-11 sm:min-h-9">
              <option value="ALL">Name and code</option><option value="NAME">College name</option><option value="CODE">College code</option>
            </Select>
          </label>
          <Button
            type="submit"
            className="min-h-11 sm:min-h-9"
          >
            Search
          </Button>
          <Link
            href="/admin/features"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Clear
          </Link>
        </form>
      </section>

      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            College module matrix
          </h2>
          <Link href={adminFeatureExportHref({
            q:result.q,page:result.page,sort:result.sort,module:result.moduleFilter??undefined,
            storedState:result.stateFilter,locks:result.lockFilter,presence:result.presenceFilter,
            recent:result.recentFilter,searchField:result.searchField,
          })} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
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

        <DataTable<(typeof result.items)[number]> caption="College module matrix"
          rows={result.items} getRowKey={college=>college.id}
          empty={<EmptyState title="No colleges on this page"
            description="No active colleges match the current search and selected Super Admin scope. Check the filters or return to the first page."/>}
          columns={[
            {key:"college",header:"College",mobilePriority:"primary",cell:college=>{
              const summary=collegeModuleCardSummary(college.modules);
              return <div className="min-w-0 space-y-2">
                <strong className="break-words">{college.name}</strong>
                <p className="text-xs text-muted-foreground">{college.code}</p>
                <StatusBadge>{summary.enabled} of {college.modules.length} enabled</StatusBadge>
                <p className="text-xs text-muted-foreground">{summary.locked} locked · {summary.persisted} rules with persisted source</p>
              </div>;
            }},
            ...OPTIONAL_MODULE_KEYS.map(module=>({
              key:module,header:ADMIN_MODULE_LABELS[module],mobilePriority:"secondary" as const,
              cell:(college:(typeof result.items)[number])=>{
                const decision=college.modules.find(item=>item.module===module);
                return decision?<div className="min-w-0">
                  <ModuleState decision={decision}/>
                  <details className="mt-2">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-text underline">
                      Change {decision.label} →
                    </summary>
                    <CollegeFeatureRuleEditor collegeId={college.id} module={decision.module}
                      stored={decision.stored} ancestorLocked={decision.ancestorLocked}/>
                  </details>
                </div>:<span className="text-muted-foreground">—</span>;
              },
            })),
            {key:"moduleAccess",header:"Module Access",mobilePriority:"action",cell:college=>
              <Link href={adminFeatureHierarchyHref(college.id,result.moduleFilter)}
                className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
                View access hierarchy →
              </Link>},
          ]}/>

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
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Filtering by module means the college has an explicit stored college-level rule for that module; it does not filter by each learner&apos;s effective access. The CSV includes only the current permissioned page (up to 20 colleges) and excludes contacts. Source: module_access_rules and the existing
        optional-module resolver. A persisted global,
        organization or college rule can override the
        source defaults. This matrix shows college-level
        access, not the access of every individual learner.
        Lower-level Projects/Electives overrides,
        placement participation decisions, and other
        authorization gates may affect a learner&apos;s
        actual experience. Guarded inline college-policy editors are available from each cell. Every change still requires fresh impact review and server-side authorization.
      </p>
    </div>
  );
}
