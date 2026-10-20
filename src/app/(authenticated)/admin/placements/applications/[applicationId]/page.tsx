import {notFound} from "next/navigation";
import Link from "next/link";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
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
 return <div className="min-w-0 space-y-5">
  <SuperAdminPlacementDetailView data={detail} extraActions={detail.related?<>
   <Link href={detail.related.href+"/applications"}
    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Manage this drive&apos;s applications and stage decisions →</Link>
   <Link href={detail.related.href+"/schedule?applicationId="+encodeURIComponent(applicationId)}
    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Schedule candidate interview →</Link>
  </>:undefined}/>
  <section aria-label="Application stage history" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-5">
   <h2 className="text-lg font-semibold text-foreground">Status history</h2>
   {history?.length?<ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{history.map(event=><li key={event.id} className="py-3 text-sm">
     <p className="flex min-w-0 flex-wrap items-center gap-2 font-semibold"><span>{event.fromStage??"New application"} →</span><StatusBadge tone="info">{event.toStage}</StatusBadge></p>
     <p className="mt-1 text-body">{event.reason}</p>
     <time className="text-xs text-muted-foreground" dateTime={event.changedAt.toISOString()}>
      {event.changedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</time>
    </li>)}</ol>:<EmptyState title="No status history" description="No persisted stage transitions recorded yet."/>}
  </section>
 </div>;
}
