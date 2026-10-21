import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {ModuleHistoryDrawer} from "@/components/admin/module-history-drawer";
import {EmptyState} from "@/components/ui/empty-state";
import {collegePolicyHistoryQuery,collegePolicyHistoryHref} from "@/modules/module-access/admin-college-rule-history-model";
import {listCollegeFeatureHistory} from "@/modules/module-access/admin-college-rule-history-service";
export const dynamic="force-dynamic";
export default async function SuperAdminCollegeFeatureHistory({params,searchParams}:{
 params:Promise<{collegeId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {collegeId}=await params;
 const cursor=collegePolicyHistoryQuery.safeParse(await searchParams);
 if(!cursor.success)notFound();
 const result=await listCollegeFeatureHistory(await getCurrentRequestContext(),collegeId,cursor.data,15);
 if(!result)notFound();
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Module Access" description="Selected-college module rule history" />
  <ModuleHistoryDrawer collegeId={collegeId}>
  <PageHeader title="Recent module-access changes" description={"Recent changes to Projects, Placements and Electives at college, academic and learner scope for "+result.college.name+"."} actions={<PageBackLink href={"/admin/features/"+encodeURIComponent(collegeId)} label="College module access"/>}/>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
  <Link href={collegePolicyHistoryHref(collegeId,cursor.data.beforeOccurredAt&&cursor.data.beforeId?{beforeOccurredAt:new Date(cursor.data.beforeOccurredAt),beforeId:cursor.data.beforeId}:null).replace("/history","/history/export")}
    className="inline-flex min-h-11 w-full items-center justify-center self-start rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] sm:w-auto md:min-h-9 hover:text-[var(--lms-primary-text)]">
    Export CSV
  </Link>
  </div>
  {result.items.length===0?<EmptyState title="No module-access changes" description="No module-access changes recorded for this college yet."/>:
   <ol className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{result.items.map(item=><li key={item.id} className="min-w-0 py-4">
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <p className="min-w-0 break-words font-semibold text-foreground">{item.category} · {item.module}</p>
      <p className="shrink-0 text-xs text-muted-foreground">{item.at.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
    </div>
    <p className="mt-2 break-words text-sm text-body">{item.change}</p>
    <p className="mt-1 break-words text-xs text-body">Scope: {item.scope}{item.studentCount===undefined?"":" · "+item.studentCount+" students"}</p>
    <p className="mt-2 break-words text-xs text-muted-foreground">{item.actorName || "System"}</p>
   </li>)}</ol>}
  {result.nextCursor?<Link href={collegePolicyHistoryHref(collegeId,result.nextCursor)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] sm:w-auto md:min-h-9 hover:text-[var(--lms-primary-text)]">Load more changes →</Link>:null}
  <nav aria-label="Other module-access reviews" className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3">
   <Link href={"/admin/features/"+encodeURIComponent(collegeId)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Review overrides →</Link>
   <Link href={"/admin/features/"+encodeURIComponent(collegeId)+"/trace"} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Search learner access →</Link>
  </nav>
  </ModuleHistoryDrawer>
 </div>;
}
