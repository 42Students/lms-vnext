import {Button} from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
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
import {adminControlScopeTag} from "@/modules/module-access/admin-control-overview-model";

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
    <div className="min-w-0 space-y-2">
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
      <Disclosure title="Rule source" className="min-w-0"
        contentClassName="pb-2 pt-2 text-xs leading-5 text-muted-foreground">
        <p className="break-words">{describeModuleDecision(decision)}</p>
      </Disclosure>
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
          title="Feature Controls"
          description="College module access, policy inheritance and guarded inline changes."
        />
        <ErrorState
          title="Invalid feature filters"
          description="The search or page number is invalid. No college module settings were loaded."
          action={
            <Link
              href="/admin/features"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white w-full md:w-auto justify-center"
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

  const controlCounts=result.scopeCounts;
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
        title="Feature Controls"
        description="Effective college-level access for the three optional modules available: Projects, Placements and Electives. Values are resolved using the existing persisted-rule inheritance and source defaults."
      />

      <section aria-label="Feature Controls overview" className="border-t border-border pt-6">
        <p className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Module availability · {scopeLabel}</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Optional modules by college</h2>
        <dl className="mt-3 grid grid-cols-2 gap-0 divide-y divide-border border-y border-border text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="min-w-0 px-4 py-3"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Colleges matching current filters</dt><dd className="mt-2 font-semibold">{result.total} in the authorized query scope</dd></div>
          <div className="min-w-0 px-4 py-3"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Projects on</dt><dd className="mt-2 font-semibold">{controlCounts.projectsOn} of {controlCounts.shown} matching colleges</dd></div>
          <div className="min-w-0 col-span-2 px-4 py-3 sm:col-span-1"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Placements on</dt><dd className="mt-2 font-semibold">{controlCounts.placementsOn} of {controlCounts.shown} matching colleges</dd></div>
        </dl>
      </section>
      <section className="border-t border-border pt-6">
        <form
          action="/admin/features"
          method="get"
          className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:items-end"
        >
          <label className="grid min-w-0 w-full flex-1 md:min-w-60 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
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
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort colleges
            <Select name="sort" defaultValue={result.sort} className="min-h-11 md:min-h-9">
              <option value="NAME">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="CODE">Code A–Z</option><option value="CODE_DESC">Code Z–A</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Colleges per page
            <Select name="pageSize" defaultValue={String(result.pageSize)} className="min-h-11 md:min-h-9">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </label>
          <Disclosure title="More college filters"
            defaultOpen={Boolean(result.moduleFilter||result.stateFilter!=="ALL"||result.lockFilter!=="ALL"||result.presenceFilter!=="ANY"||result.recentFilter!=="ALL"||result.searchField!=="ALL")}
            className="min-w-0 sm:w-full"
            contentClassName="grid min-w-0 gap-3 pb-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Explicit college rule for
            <Select name="module" defaultValue={result.moduleFilter ?? ""} className="min-h-11 md:min-h-9">
              <option value="">Any college</option><option value="projects">Projects</option><option value="placements">Placements</option><option value="electives">Electives</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored college value
            <Select name="storedState" defaultValue={result.stateFilter} className="min-h-11 md:min-h-9">
              <option value="ALL">Any value</option><option value="ON">Stored On</option><option value="OFF">Stored Off</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">College rule lock
            <Select name="locks" defaultValue={result.lockFilter} className="min-h-11 md:min-h-9">
              <option value="ALL">Any lock</option><option value="LOCKED">Stored locked only</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">College rule presence
            <Select name="presence" defaultValue={result.presenceFilter} className="min-h-11 md:min-h-9">
              <option value="ANY">Any college</option><option value="HAS_RULE">Has stored rule</option><option value="NO_RULE">No stored rule</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored rule last updated
            <Select name="recent" defaultValue={result.recentFilter} className="min-h-11 md:min-h-9">
              <option value="ALL">Any date</option><option value="7D">Last 7 days</option><option value="30D">Last 30 days</option><option value="90D">Last 90 days</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search in
            <Select name="searchField" defaultValue={result.searchField} className="min-h-11 md:min-h-9">
              <option value="ALL">Name and code</option><option value="NAME">College name</option><option value="CODE">College code</option>
            </Select>
          </label>
          </Disclosure>
          <Button
            type="submit"
            className="min-h-11 w-full justify-center sm:w-auto md:min-h-9"
          >
            Search
          </Button>
          {(Boolean(result.q)||Boolean(result.moduleFilter)||result.stateFilter!=="ALL"||result.lockFilter!=="ALL"||result.presenceFilter!=="ANY"||result.recentFilter!=="ALL"||result.searchField!=="ALL")?<Link
            href="/admin/features"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white"
          >
            Clear
          </Link>
        </form>
      </section>

      <section className="min-w-0 space-y-3">
        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            College module matrix
          </h2>
          <Link href={adminFeatureExportHref({
            q:result.q,page:result.page,pageSize:result.pageSize,sort:result.sort,module:result.moduleFilter??undefined,
            storedState:result.stateFilter,locks:result.lockFilter,presence:result.presenceFilter,
            recent:result.recentFilter,searchField:result.searchField,
          })} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">
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
                <Disclosure title="Stored-rule details" className="min-w-0" contentClassName="pt-1 pb-2">
                  <p className="text-xs text-muted-foreground">{summary.locked} locked · {summary.persisted} rules with persisted source</p>
                </Disclosure>
              </div>;
            }},
            ...OPTIONAL_MODULE_KEYS.map(module=>({
              key:module,header:ADMIN_MODULE_LABELS[module],mobilePriority:"secondary" as const,
              cell:(college:(typeof result.items)[number])=>{
                const decision=college.modules.find(item=>item.module===module);
                return decision?<div className="min-w-0">
                  <ModuleState decision={decision}/>
                  {decision.module==="projects"||decision.module==="placements" ?
                    <CollegeFeatureRuleEditor collegeId={college.id} module={decision.module}
                      stored={decision.stored} ancestorLocked={decision.ancestorLocked}/> :
                    <Disclosure title={"Change "+decision.label+" →"}
                      className="mt-2 [&>summary]:min-h-11 [&>summary]:text-primary-text">
                      <CollegeFeatureRuleEditor collegeId={college.id} module={decision.module}
                        stored={decision.stored} ancestorLocked={decision.ancestorLocked}/>
                    </Disclosure>}
                </div>:<span className="text-muted-foreground">—</span>;
              },
            })),
            {key:"moduleAccess",header:"Module Access",mobilePriority:"action",cell:college=>
              <Link href={adminFeatureHierarchyHref(college.id,result.moduleFilter)}
                className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] underline-offset-4">
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
          <div className="flex flex-wrap gap-2">
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
                  pageSize:result.pageSize,
                })}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)]"
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
                  pageSize:result.pageSize,
                })}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)]"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <Disclosure title="How to interpret module access" className="min-w-0" contentClassName="max-w-4xl pb-3 pt-2">
      <p className="text-xs leading-5 text-muted-foreground">
        Filtering by module means the college has an explicit stored college-level rule for that module; it does not filter by each learner&apos;s effective access. The CSV includes only the current permissioned page (up to 100 colleges) and excludes contacts. Source: module_access_rules and the existing
        optional-module resolver. A persisted global,
        organization or college rule can override the
        source defaults. This matrix shows college-level
        access, not the access of every individual learner.
        Lower-level Projects/Electives overrides,
        placement participation decisions, and other
        authorization gates may affect a learner&apos;s
        actual experience. Projects and Placements offer direct Turn on/Turn off controls
        in the matrix; changes are not applied until the guarded impact review and
        server-side authorization succeed. Electives retains the advanced disclosure.
        The legacy one-click switch would bypass the intentional vNext Inherit/Lock
        and explicit-impact contracts, so it is not silently reintroduced.
      </p>
      </Disclosure>
    </div>
  );
}
