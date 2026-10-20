import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {Pagination} from "@/components/ui/pagination";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import {parseAdminFeaturePageParams} from "@/modules/module-access/admin-feature-query";
import {listSuperAdminFeatureControls} from "@/modules/module-access/admin-read-service";
import {getModuleAccessOverviewMetrics} from "@/modules/module-access/admin-overview-metrics-service";
import {adminControlScopeTag} from "@/modules/module-access/admin-control-overview-model";

type SearchParams=Record<string,string|string[]|undefined>;
function pageHref(q:string,page:number){
  const params=new URLSearchParams();
  if(q)params.set("q",q);
  if(page>1)params.set("page",String(page));
  return "/admin/module-access"+(params.size?"?"+params.toString():"");
}

/** Real landing page into existing persisted module-access scope/rule editor. */
export default async function SuperAdminModuleAccessPage({
  searchParams,
}:{searchParams:Promise<SearchParams>}){
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const parsed=parseAdminFeaturePageParams(await searchParams);
  if(!parsed)return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Module Access"/>
    <ErrorState title="Invalid feature filters"
      description="The search or page value is invalid."
      action={<Link href="/admin/module-access" className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:text-primary-hover md:min-h-9 hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>}/>
  </div>;
  const result=await listSuperAdminFeatureControls(context,parsed);
  const scopeMetrics=await getModuleAccessOverviewMetrics(context,result.items.map(item=>item.id));
  const scopeLabel=adminControlScopeTag(context.adminScope);
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Module Access"
      description="Select a college to inspect the existing inherited module access rules."
      actions={<Link href="/admin/features" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Feature Controls</Link>}/>
    <section aria-label="Module Access overview" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
      <p className="text-sm font-semibold text-body">Effective access · {scopeLabel}</p>
      <h2 className="mt-[var(--lms-space-1)] text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Optional module access hierarchy</h2>
      <dl className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)] text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 border-t border-border pt-[var(--lms-space-2)]"><dt className="text-muted-foreground">Hierarchy scopes</dt><dd className="mt-[var(--lms-space-1)] break-words font-semibold text-[var(--lms-heading)]">Global, organization, college, department, program, batch, class and learner</dd></div>
        <div className="min-w-0 border-t border-border pt-[var(--lms-space-2)]"><dt className="text-muted-foreground">Students in largest scope</dt><dd className="mt-[var(--lms-space-1)] break-words font-semibold text-[var(--lms-heading)]">{scopeMetrics.largestLearnerScope} active learners in the visible colleges</dd></div>
        <div className="min-w-0 border-t border-border pt-[var(--lms-space-2)]"><dt className="text-muted-foreground">Student overrides</dt><dd className="mt-[var(--lms-space-1)] break-words font-semibold text-[var(--lms-heading)]">{scopeMetrics.studentOverrides} stored membership rules in the visible colleges</dd></div>
      </dl>
    </section>
    <form method="get" aria-label="Filter module access" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_auto_auto]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        College
        <Input type="search" name="q" maxLength={100} defaultValue={result.q} placeholder="Search colleges"
          className="w-full"/>
      </label>
      <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
      <Link className="inline-flex min-h-11 w-full items-center justify-center px-3 py-2 text-sm font-semibold text-primary-text md:min-h-9 hover:text-[var(--lms-primary)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
        href="/admin/module-access">Clear filters</Link>
    </form>
    <p role="status" className="text-sm text-body">
      {result.total} colleges · page {result.page} of {result.totalPages}
    </p>
    {result.items.length===0?<EmptyState title="No matching colleges"
      description="No college in the current scope matches these filters." action={<Link href="/admin/module-access" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>:
      <div className="min-w-0 divide-y divide-border border-y border-border">
        {result.items.map(college=><article key={college.id}
          className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-2)] py-[var(--lms-space-4)] first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h2 className="break-words text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{college.name}</h2>
            <p className="mt-[var(--lms-space-1)] text-sm text-body">{college.code}</p>
          </div>
          <Link href={"/admin/features/"+encodeURIComponent(college.id)}
            className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text sm:w-auto hover:text-primary-hover md:min-h-9 hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            Module Access →
          </Link>
        </article>)}
      </div>}
    <div className="border-t border-border pt-[var(--lms-space-3)]"><Pagination page={result.page} pageCount={result.totalPages}
      hrefForPage={page=>pageHref(result.q,page)} label="Module Access pages"/></div>
  </div>;
}
