import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
  const parsed=parseAdminFeaturePageParams(await searchParams);
  if(!parsed)return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin" title="Module Access"/>
    <ErrorState title="Invalid feature filters"
      description="The search or page value is invalid."
      action={<Link href="/admin/module-access" className="font-semibold text-primary-text">Clear filters</Link>}/>
  </div>;
  const result=await listSuperAdminFeatureControls(context,parsed);
  const scopeMetrics=await getModuleAccessOverviewMetrics(context,result.items.map(item=>item.id));
  const scopeLabel=adminControlScopeTag(context.adminScope);
  return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin" title="Module Access"
      description="Select a college to inspect the existing inherited module access rules."
      actions={<Link href="/admin/features" className="font-semibold text-primary-text">Feature Controls</Link>}/>
    <section aria-label="Module Access overview" className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Effective access · {scopeLabel}</p>
      <h2 className="mt-1 text-base font-semibold">Optional module access hierarchy</h2>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt>Hierarchy scopes</dt><dd className="font-semibold">Global, organization, college, department, program, batch, class and learner</dd></div>
        <div><dt>Students in largest scope</dt><dd className="font-semibold">{scopeMetrics.largestLearnerScope} active learners in the visible colleges</dd></div>
        <div><dt>Student overrides</dt><dd className="font-semibold">{scopeMetrics.studentOverrides} stored membership rules in the visible colleges</dd></div>
      </dl>
    </section>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
      <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-body">
        College
        <input type="search" name="q" maxLength={100} defaultValue={result.q}
          className="min-h-11 rounded-md border border-border bg-surface px-3"/>
      </label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
      <Link className="min-h-11 px-3 py-3 text-sm font-semibold text-primary-text"
        href="/admin/module-access">Clear filters</Link>
    </form>
    <p role="status" className="text-sm text-body">
      {result.total} colleges · page {result.page} of {result.totalPages}
    </p>
    {result.items.length===0?<EmptyState title="No matching colleges"
      description="No college in the current scope matches these filters."/>:
      <div className="grid gap-3 md:grid-cols-2">
        {result.items.map(college=><article key={college.id}
          className="min-w-0 rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-foreground">{college.name}</h2>
          <p className="mt-1 text-sm text-body">{college.code}</p>
          <Link href={"/admin/features/"+encodeURIComponent(college.id)}
            className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
            Module Access →
          </Link>
        </article>)}
      </div>}
    <nav aria-label="Module Access pages" className="flex flex-wrap items-center gap-4 text-sm">
      {result.page>1?<Link href={pageHref(result.q,result.page-1)}>Previous</Link>:null}
      {result.page<result.totalPages?<Link href={pageHref(result.q,result.page+1)}>Next</Link>:null}
    </nav>
  </div>;
}
