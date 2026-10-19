import {notFound} from "next/navigation";
import Link from "next/link";
import {EmptyState} from "@/components/ui/empty-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminApplicationDetail} from "@/modules/admin-ui/super-admin-application-detail-service";
import {listSuperAdminApplicationStageHistory} from "@/modules/admin-ui/super-admin-application-stage-history-service";
export default async function SuperAdminApplicationDetail({params}:{params:Promise<{applicationId:string}>}){
 const {applicationId}=await params;
 const context=await getCurrentRequestContext();
 const detail=await getSuperAdminApplicationDetail(context,applicationId);
 if(!detail)notFound();
 const history=await listSuperAdminApplicationStageHistory(context,applicationId);
 return <div className="space-y-5">
  <SuperAdminPlacementDetailView data={detail}/>
  {detail.related?<div className="flex flex-wrap gap-3">
   <Link href={detail.related.href+"/applications"} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Manage this drive&apos;s applications and stage decisions →</Link>
   <Link href={detail.related.href+"/schedule?applicationId="+encodeURIComponent(applicationId)} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Schedule candidate interview →</Link>
  </div>:null}
  <section aria-label="Application stage history" className="space-y-3 border-b border-border pb-5">
   <h2 className="text-lg font-semibold">Status history</h2>
   {history?.length?<ol className="divide-y divide-border border-y border-border">{history.map(event=><li key={event.id} className="py-3 text-sm">
     <p className="font-semibold">{event.fromStage??"New application"} → {event.toStage}</p>
     <p className="mt-1 text-body">{event.reason}</p>
     <time className="text-xs text-muted-foreground" dateTime={event.changedAt.toISOString()}>
      {event.changedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</time>
    </li>)}</ol>:<EmptyState title="No status history" description="No persisted stage transitions recorded yet."/>}
  </section>
 </div>;
}
