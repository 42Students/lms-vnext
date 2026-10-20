import {notFound} from "next/navigation";
import Link from "next/link";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
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
 return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <SuperAdminPlacementDetailView data={detail} extraActions={detail.related?<details className="min-w-0">
   <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Related actions</summary>
   <div className="mt-[var(--lms-space-2)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:items-start">
   <Link href={detail.related.href+"/applications"}
    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Manage this drive&apos;s applications and stage decisions →</Link>
   <Link href={detail.related.href+"/schedule?applicationId="+encodeURIComponent(applicationId)}
    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Schedule candidate interview →</Link>
   </div>
  </details>:undefined}/>
  <section aria-label="Application stage history" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
   <h2 className="text-base font-semibold text-foreground">Status history</h2>
   {history?.length?<ol className="min-w-0 divide-y divide-border border-y border-border">{history.map(event=><li key={event.id} className="min-w-0 py-[var(--lms-space-3)] first:pt-0 text-sm">
     <p className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] break-words font-semibold text-[var(--lms-heading)]"><span>{event.fromStage??"New application"} →</span><StatusBadge tone="info">{event.toStage}</StatusBadge></p>
     <p className="mt-[var(--lms-space-1)] break-words text-body">{event.reason}</p>
     <time className="text-xs text-muted-foreground" dateTime={event.changedAt.toISOString()}>
      {event.changedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</time>
    </li>)}</ol>:<EmptyState title="No status history" description="No persisted stage transitions recorded yet."/>}
  </section>
 </div>;
}
