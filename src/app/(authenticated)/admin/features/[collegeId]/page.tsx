import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { collegeIdSchema } from "@/modules/colleges/validation";
import { requirePermission } from "@/modules/permissions/policy";
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
      <div className="space-y-5">
        <PageHeader eyebrow="Super Admin · Module Access" title="Module Access" />
        <ErrorState title="Invalid module access filters"
          description="The module, scope or requested page is invalid. No college module rules were loaded."
          action={<Link href={"/admin/features/"+encodeURIComponent(collegeId)}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
            Clear filters
          </Link>} />
      </div>
    );
  }
  const {academicPage,...filters}=parsed;
  const result = await getSuperAdminCollegeModuleAccess(context,collegeId,filters);
  if (!result) notFound();

  const { college, modules, ancestors } = result;
  const academicScopes=await listCollegeModuleScopeChoices(context,college.id,academicPage);
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
    return base + (parts.size ? "?" + parts.toString() : "");
  };

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/admin/features"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Feature Controls
      </Link>

      <PageHeader
        eyebrow="Super Admin · Module Access"
        title={`${college.name} · Access hierarchy`}
        description={`Inspect and update college rules for ${college.code}. Higher-priority locks and learner participation gates still apply.`}
      />

      <LearnerModuleAccessDrawer collegeId={college.id}/>

      <section className="border-t border-border pt-5">
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
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
          >
            Open learner access trace →
          </Link>
        </div>
      </section>

      <Link href={"/admin/features/"+encodeURIComponent(college.id)+"/history"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        View audited college module changes →
      </Link>
      <section className="grid gap-3 md:grid-cols-3">
        {modules.map((decision) => (
          <article
            key={decision.module}
            className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5"
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
            <CollegeFeatureRuleEditor collegeId={college.id} module={decision.module}
              stored={(()=>{const r=ancestors.find(rule=>rule.scopeType==="COLLEGE"&&rule.module===decision.module);return r?{enabled:r.enabled,locked:r.locked}:null;})()}
              ancestorLocked={ancestors.some(rule=>rule.module===decision.module&&rule.locked&&(rule.scopeType==="GLOBAL"||rule.scopeType==="ORGANIZATION"))}/>
          </article>
        ))}
      </section>

      <section className="border-t border-border pt-5" aria-label="Placements college access impact">
        <h2 className="text-base font-semibold text-foreground">Placements: college-level access impact</h2>
        {modules.filter(decision=>decision.module==="placements").map(decision=>(
          <div key={decision.module} className="mt-3 space-y-2 text-sm text-body">
            <p>Effective policy in {college.name}: <strong>{decision.enabled?"On":"Off"}</strong></p>
            <p>{placementFeatureEffects(decision.enabled).impact}</p>
            <p className="text-xs text-muted-foreground">Learner academic Placements overrides can change individual access. This college-level preview does not claim every learner has the same effective policy.</p>
            <p className="text-xs text-muted-foreground">Turning access off does not delete historical jobs, applications or learner placement records.</p>
          </div>
        ))}
      </section>

      <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4" aria-label="Filter stored module overrides">
        <label className="grid gap-1 text-sm font-semibold text-body">Stored descendant module
          <Select name="module" defaultValue={result.moduleFilter ?? ""} className="min-h-11 sm:min-h-9">
            <option value="">All modules</option>
            {OPTIONAL_MODULE_KEYS.map(key => <option key={key} value={key}>{ADMIN_MODULE_LABELS[key]}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Stored scope
          <Select name="scope" defaultValue={result.scopeFilter ?? ""} className="min-h-11 sm:min-h-9">
            <option value="">All descendant scopes</option>
            {(["DEPARTMENT","PROGRAM","COHORT","SECTION","MEMBERSHIP"] as const).map(key =>
              <option key={key} value={key}>{MODULE_SCOPE_LABELS[key]}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Lock state
          <Select name="locks" defaultValue={result.lockFilter} className="min-h-11 sm:min-h-9">
            <option value="ALL">All stored rules</option><option value="LOCKED">Locked rules only</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Stored value
          <Select name="storedState" defaultValue={result.stateFilter} className="min-h-11 sm:min-h-9">
            <option value="ALL">Any stored value</option><option value="ON">Stored On</option><option value="OFF">Stored Off</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Exact scope ID (optional)
          <Input name="scopeId" type="text" defaultValue={result.scopeIdFilter ?? ""} placeholder="UUID; select scope type" maxLength={36} className="min-h-11 sm:min-h-9"/>
        </label>
        <Button type="submit" className="min-h-11 sm:min-h-9">Filter overrides</Button>
        <Link href={"/admin/features/" + encodeURIComponent(college.id)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Reset</Link>
      </form>

      <section className="min-w-0 space-y-3">
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

        <DataTable<(typeof OPTIONAL_MODULE_KEYS)[number]> caption="College module inheritance"
          rows={OPTIONAL_MODULE_KEYS} getRowKey={module=>module}
          empty={<p role="status">No lower-level overrides</p>}
          columns={[
            {key:"module",header:"Module",mobilePriority:"primary",cell:module=><strong>{ADMIN_MODULE_LABELS[module]}</strong>},
            ...ancestorLevels.map(level=>({
              key:level,header:MODULE_SCOPE_LABELS[level],mobilePriority:"secondary" as const,
              cell:(module:(typeof OPTIONAL_MODULE_KEYS)[number])=>{
                const stored=ancestorRule(level,module);
                return <span className="font-semibold">{stored?describeStoredOverride(stored):"Inherit"}</span>;
              },
            })),
            {key:"effective",header:"Effective at college",mobilePriority:"secondary",cell:module=>{
              const effective=modules.find(value=>value.module===module);
              return <span className="font-semibold">{effective?effective.enabled?"On":"Off":"Unavailable"}</span>;
            }},
          ]}/>

      </section>

      <section aria-label="Academic module rules" className="border-t border-border pt-5">
        <h2 className="font-semibold">Department, Program, Batch and Class access</h2>
        <p className="mt-2 text-sm text-body">Select an academic scope, set Projects, Placements or Electives On, Off, or Inherit, and apply an optional lock.</p>
        <DescendantFeatureRuleEditor collegeId={college.id} scopes={academicScopes}/>
        <AcademicModuleScopeInventory scopes={academicScopes} page={academicPage}
   baseHref={"/admin/features/"+encodeURIComponent(college.id)}/>
      </section>
      <section className="min-w-0 space-y-3">
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
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={pageHref(result.page - 1)}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
              >
                ← Previous
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                href={pageHref(result.page + 1)}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
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
