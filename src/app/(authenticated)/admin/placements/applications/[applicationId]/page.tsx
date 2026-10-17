import {notFound} from "next/navigation";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminApplicationDetail} from "@/modules/admin-ui/super-admin-application-detail-service";
import {listSuperAdminApplicationStageHistory} from "@/modules/admin-ui/super-admin-application-stage-history-service";
export default async function SuperAdminApplicationDetail({params}:{params:Promise<{applicationId:string}>}){
 const {applicationId}=await params;
 const detail=await getSuperAdminApplicationDetail(await getCurrentRequestContext(),applicationId);
 if(!detail)notFound();
 const history=await listSuperAdminApplicationStageHistory(await getCurrentRequestContext(),applicationId);
 return <div className="space-y-5">
  <SuperAdminPlacementDetailView data={detail}/>
  {detail.related?<Link href={detail.related.href+"/applications"} className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Manage this drive\u2019s applications and stage decisions →</Link>:null}
  <section aria-label="Application stage history" className="space-y-3 rounded-xl border border-border bg-surface p-5">
   <h2 className="text-lg font-semibold">Status history</h2>
   {history?.length?<ol className="space-y-2">{history.map(event=><li key={event.id} className="rounded-md border border-border p-3 text-sm">
     <p className="font-semibold">{event.fromStage??"New application"} → {event.toStage}</p>
     <p className="mt-1 text-body">{event.reason}</p>
     <time className="text-xs text-muted-foreground" dateTime={event.changedAt.toISOString()}>
      {event.changedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</time>
    </li>)}</ol>:<p role="status" className="text-sm text-muted-foreground">No persisted stage transitions recorded yet.</p>}
  </section>
 </div>;
}
