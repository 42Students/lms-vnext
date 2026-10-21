import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
import { collegeIdSchema } from "@/modules/colleges/validation";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {parseAdminModuleDetailPageParams} from "@/modules/module-access/admin-module-detail-query";
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
import {CollegeFeatureRuleEditor} from "@/components/admin/college-feature-rule-editor";
import {LearnerModuleAccessDrawer} from "@/components/admin/learner-module-access-drawer";
import {DescendantFeatureRuleEditor} from "@/components/admin/descendant-feature-rule-editor";
import {AcademicModuleScopeInventory} from "@/components/admin/academic-module-scope-inventory";
import {listCollegeModuleScopeChoices} from "@/modules/module-access/admin-descendant-rule-write";

type SearchParams = Record<string,string|string[]|undefined>;

export default async function SuperAdminCollegeModuleAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ collegeId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const { collegeId } = await params;

  if (!collegeIdSchema.safeParse(collegeId).success) {
    notFound();
  }

  const parsed=parseAdminModuleDetailPageParams(await searchParams);
  if (!parsed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Module Access" />
        <ErrorState title="Invalid module access filters"
          description="The module, scope or requested page is invalid. No college module rules were loaded."
          action={<Link href={"/admin/features/"+encodeURIComponent(collegeId)}
            className="inline-flex min-h-11 items-center text-sm font-[650] text-primary-text underline hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4 md:min-h-9">
            Clear filters
          </Link>} />
      </div>
    );
  }
  const {academicPage,...filters}=parsed;
  const moduleRead = await getSuperAdminCollegeModuleAccess(context,collegeId,filters)
    .then(value => ({ok:true as const,value}))
    .catch(error => {
      if (error instanceof AuthorizationError) throw error;
      return {ok:false as const,value:null};
    });
  if (!moduleRead.ok) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Module Access" />
      <ErrorState title="Couldn't load module access"
        description="The selected college hierarchy could not be loaded. No module rules were changed."
        action={<Link href={"/admin/features/"+encodeURIComponent(collegeId)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
          Retry loading module access
        </Link>}/>
    </div>;
  }
  const result = moduleRead.value;
  if (!result) notFound();

  const { college, modules, ancestors } = result;
  const academicRead = await listCollegeModuleScopeChoices(context,college.id,academicPage)
    .then(value => ({ok:true as const,value}))
    .catch(error => {
      if (error instanceof AuthorizationError) throw error;
      return {ok:false as const,value:null};
    });
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
    if (result.scopeIdFilter) parts.set("scopeId", result.scopeIdFilter);
    if (page > 1) parts.set("page", String(page));
    if (academicPage > 1) parts.set("academicPage", String(academicPage));
    return base + (parts.size ? "?" + parts.toString() : "");
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={`${college.name} · Access hierarchy`}
        description={`Inspect and update college rules for ${college.code}. Higher-priority locks and learner participation gates still apply.`}
        actions={<Link href="/admin/features" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">← Feature Controls</Link>}
      />

      <LearnerModuleAccessDrawer collegeId={college.id}/>

      <nav aria-label="Learner access explanation" className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] pb-4">
        <p className="max-w-2xl text-sm leading-6 text-body">
          Find an active learner to trace the module-access decision through membership, academic scopes, college, organization, global rules and defaults.
        </p>
        <Link href={`/admin/features/${encodeURIComponent(college.id)}/trace`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">
          Open learner access trace →
        </Link>
      </nav>

      <Link href={"/admin/features/"+encodeURIComponent(college.id)+"/history"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">
        View audited college module changes →
      </Link>
      <section className="grid min-w-0 gap-x-6 gap-y-0 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((decision) => (
          <article
            key={decision.module}
            className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4 md:py-4"
          >
            <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">
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
            <CollegeFeatureRuleEditor collegeId={college.id} module={decision.module}
              stored={(()=>{const r=ancestors.find(rule=>rule.scopeType==="COLLEGE"&&rule.module===decision.module);return r?{enabled:r.enabled,locked:r.locked}:null;})()}
              ancestorLocked={ancestors.some(rule=>rule.module===decision.module&&rule.locked&&(rule.scopeType==="GLOBAL"||rule.scopeType==="ORGANIZATION"))}/>
          </article>
        ))}
      </section>

      <section className="min-w-0 border-t border-border pt-4" aria-label="Placements college access impact">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Placements: college-level access impact</h2>
        <Disclosure title="View Placements impact" className="mt-2" contentClassName="pb-3 pt-2">
        {modules.filter(decision=>decision.module==="placements").map(decision=>(
          <div key={decision.module} className="mt-3 space-y-2 text-sm text-body">
            <p>Effective policy in {college.name}: <strong>{decision.enabled?"On":"Off"}</strong></p>
            <p>{placementFeatureEffects(decision.enabled).impact}</p>
            <p className="text-xs text-muted-foreground">Placement cell decides learner eligibility. Historical academic Placements rules may still be stored, but this preview does not treat them as eligibility decisions.</p>
            <p className="text-xs text-muted-foreground">Turning access off does not delete historical jobs, applications or learner placement records.</p>
            <Banner tone="warning" role="status">
              Active jobs, in-progress applications, pending offers and upcoming interviews:
              verified impact counts are not available from this module-access read.
              Review the selected college in Placement Operations before disabling access.
              <Link href="/admin/placements" className="ml-2 font-semibold text-primary-text underline">
                Review placements
              </Link>
            </Banner>
          </div>
        ))}
        </Disclosure>
      </section>

      <form method="get" className="flex flex-wrap items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] max-[767px]:flex-col max-[767px]:items-stretch" aria-label="Filter stored module overrides">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored descendant module
          <Select name="module" defaultValue={result.moduleFilter ?? ""} className="min-h-11 min-[768px]:min-h-9">
            <option value="">All modules</option>
            {OPTIONAL_MODULE_KEYS.map(key => <option key={key} value={key}>{ADMIN_MODULE_LABELS[key]}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored scope
          <Select name="scope" defaultValue={result.scopeFilter ?? ""} className="min-h-11 md:min-h-9">
            <option value="">All descendant scopes</option>
            {(["DEPARTMENT","PROGRAM","COHORT","SECTION","MEMBERSHIP"] as const).map(key =>
              <option key={key} value={key}>{MODULE_SCOPE_LABELS[key]}</option>)}
          </Select>
        </label>
        <Disclosure title="More override filters"
          defaultOpen={Boolean(result.lockFilter==="LOCKED" || result.stateFilter!=="ALL" || result.scopeIdFilter)}
          className="min-w-0"
          contentClassName="grid min-w-0 gap-3 pb-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lock state
          <Select name="locks" defaultValue={result.lockFilter} className="min-h-11 md:min-h-9">
            <option value="ALL">All stored rules</option><option value="LOCKED">Locked rules only</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored value
          <Select name="storedState" defaultValue={result.stateFilter} className="min-h-11 md:min-h-9">
            <option value="ALL">Any stored value</option><option value="ON">Stored On</option><option value="OFF">Stored Off</option>
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact scope ID (optional)
          <Input name="scopeId" type="text" defaultValue={result.scopeIdFilter ?? ""} placeholder="UUID; select scope type" maxLength={36} className="min-h-11 md:min-h-9"/>
        </label>
        </Disclosure>
        <Button type="submit" className="min-h-11 w-full justify-center sm:w-auto min-[768px]:min-h-9">Filter overrides</Button>
        <Link href={"/admin/features/" + encodeURIComponent(college.id)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Reset</Link>
      </form>

      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">
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

        <DataTable<(typeof OPTIONAL_MODULE_KEYS)[number]> caption="College module inheritance"
          rows={OPTIONAL_MODULE_KEYS} getRowKey={module=>module}
          empty={<EmptyState title="No lower-level overrides" description="No lower-level module overrides are available in this inheritance view."/>}
          columns={[
            {key:"module",header:"Module",mobilePriority:"primary",cell:module=><strong>{ADMIN_MODULE_LABELS[module]}</strong>},
            ...ancestorLevels.map(level=>({
              key:level,header:MODULE_SCOPE_LABELS[level],mobilePriority:"secondary" as const,
              cell:(module:(typeof OPTIONAL_MODULE_KEYS)[number])=>{
                const stored=ancestorRule(level,module);
                return <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={!stored?"neutral":stored.enabled?"success":"neutral"}>
                    {!stored?"Inherit":stored.enabled?"On":"Off"}
                  </StatusBadge>
                  {stored?.locked ? <span className="text-xs font-semibold text-warning-text">Locked</span> : null}
                  {!stored ? <span className="text-xs text-muted-foreground">No stored rule</span> : null}
                </span>;
              },
            })),
            {key:"effective",header:"Effective at college",mobilePriority:"secondary",cell:module=>{
              const effective=modules.find(value=>value.module===module);
              return effective ? <div className="space-y-1">
                <StatusBadge tone={effective.enabled?"success":"neutral"}>{effective.enabled?"On":"Off"}</StatusBadge>
                <p className="text-xs leading-5 text-muted-foreground">{describeModuleDecision(effective)}</p>
              </div> : <span className="text-xs text-warning-text">Unavailable</span>;
            }},
          ]}/>

      </section>

      <section aria-label="Academic module rules" className="border-t border-border pt-6">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Department, Program, Batch and Class access</h2>
        <p className="mt-2 text-sm text-body">Select an academic scope to set Projects or Electives On, Off, or Inherit, with an optional lock. Placements eligibility is decided by the placement cell; that control is read-only here.</p>
        {academicRead.ok ? <>
          <DescendantFeatureRuleEditor collegeId={college.id} scopes={academicRead.value}/>
          <AcademicModuleScopeInventory scopes={academicRead.value} page={academicPage}
            baseHref={pageHref(result.page)}/>
        </> : <Banner tone="warning" role="status">
          Couldn't load student overrides or the academic hierarchy. Existing college
          module decisions are still shown above. No descendant rules were changed.
          <Link href={pageHref(result.page)} className="ml-2 font-semibold text-primary-text underline">
            Retry loading student overrides
          </Link>
        </Banner>}
      </section>
      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">
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
            Placements follows the active learner academic scope, higher-level locks and individual policy.
          </p>
        </div>

        <DataTable<(typeof result.descendants)[number]> caption="Persisted lower-level overrides"
          rows={result.descendants} getRowKey={item=>`${item.scopeType}:${item.scopeId}:${item.module}`}
          empty={<EmptyState
            title={result.total===0?"No lower-level overrides":"No overrides on this page"}
            description={result.total===0
              ?"No persisted department, program, cohort, section or membership rules were found for this college. Access continues to follow the higher-level rules and source defaults."
              :"The requested page is outside the available override range."}/>}
          columns={[
            {key:"scope",header:"Scope",mobilePriority:"secondary",cell:item=>
              MODULE_SCOPE_LABELS[item.scopeType as keyof typeof MODULE_SCOPE_LABELS]??item.scopeType},
            {key:"path",header:"Academic path / membership",mobilePriority:"primary",cell:item=><strong>{item.scopeLabel}</strong>},
            {key:"module",header:"Module",mobilePriority:"secondary",cell:item=>
              ADMIN_MODULE_LABELS[item.module as keyof typeof ADMIN_MODULE_LABELS]??item.module},
            {key:"rule",header:"Stored rule",mobilePriority:"secondary",cell:item=>
              <StatusBadge tone={item.enabled?"success":"neutral"}>{describeStoredOverride(item)}</StatusBadge>},
          ]}/>

        <nav
          aria-label="Module overrides pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            {result.total} stored overrides ·
            page {result.page} of {result.totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.page > 1 ? (
              <Link
                href={pageHref(result.page - 1)}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)]"
              >
                ← Previous
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                href={pageHref(result.page + 1)}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)]"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <Disclosure title="Policy notes" className="mt-4" contentClassName="pt-2 pb-3">
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
      </Disclosure>
    </div>
  );
}
