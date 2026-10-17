import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {collegePolicyHistoryQuery,collegePolicyHistoryHref} from "@/modules/module-access/admin-college-rule-history-model";
import {listCollegeFeatureHistory} from "@/modules/module-access/admin-college-rule-history-service";
export const dynamic="force-dynamic";
export default async function SuperAdminCollegeFeatureHistory({params,searchParams}:{
 params:Promise<{collegeId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {collegeId}=await params;
 const cursor=collegePolicyHistoryQuery.safeParse(await searchParams);
 if(!cursor.success)notFound();
 const result=await listCollegeFeatureHistory(await getCurrentRequestContext(),collegeId,cursor.data);
 if(!result)notFound();
 return <div className="space-y-6">
  <Link href={"/admin/features/"+encodeURIComponent(collegeId)} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← College module access</Link>
  <PageHeader eyebrow="Super Admin · Feature Controls" title="Recent module-access changes" description={"Recent changes to Projects, Placements and Electives at college, academic and learner scope for "+result.college.name+"."}/>
  <Link href={collegePolicyHistoryHref(collegeId,cursor.data.beforeOccurredAt&&cursor.data.beforeId?{beforeOccurredAt:new Date(cursor.data.beforeOccurredAt),beforeId:cursor.data.beforeId}:null).replace("/history","/history/export")}
    className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
    Export this audited page (CSV)
  </Link>
  {result.items.length===0?<p role="status" className="rounded-lg border border-border p-4 text-sm text-body">No module-access changes recorded for this college yet.</p>:
   <ol className="space-y-3">{result.items.map(item=><li key={item.id} className="rounded-lg border border-border bg-surface p-4">
    <p className="font-semibold text-foreground">{item.category} · {item.module}</p><p className="mt-1 text-sm text-body">{item.change}</p><p className="mt-1 break-all text-xs text-body">Scope: {item.scope}{item.studentCount===undefined?"":" · "+item.studentCount+" students"}</p>
    <p className="mt-2 text-xs text-muted-foreground">{item.actorName} · {item.at.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
   </li>)}</ol>}
  {result.nextCursor?<Link href={collegePolicyHistoryHref(collegeId,result.nextCursor)} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">Load more changes →</Link>:null}
 </div>;
}
