import {notFound} from "next/navigation";
import {EmptyState} from "@/components/ui/empty-state";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminApplicationDetail} from "@/modules/admin-ui/super-admin-application-detail-service";
import {listSuperAdminApplicationStageHistory} from "@/modules/admin-ui/super-admin-application-stage-history-service";
import { Heading } from "@/components/ui/heading";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";
export default async function SuperAdminApplicationDetail({params}:{params:Promise<{applicationId:string}>}){
 const {applicationId}=await params;
 const context=await getCurrentRequestContext();
 const detail=await getSuperAdminApplicationDetail(context,applicationId);
 if(!detail)notFound();
 const history=await listSuperAdminApplicationStageHistory(context,applicationId);
 return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <SuperAdminPlacementDetailView data={detail} extraActions={detail.related?<Disclosure title="Related actions" className="min-w-0">
   <div className="mt-[var(--lms-space-2)] flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:items-start">
   <ButtonLink variant="secondary" href={detail.related.href+"/applications"}>Manage this drive&apos;s applications and stage decisions →</ButtonLink>
   <ButtonLink variant="secondary" href={detail.related.href+"/schedule?applicationId="+encodeURIComponent(applicationId)}>Schedule candidate interview →</ButtonLink>
   </div>
  </Disclosure>:undefined}/>
  <section aria-label="Application stage history" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
   <Heading level={2} size="base" className="text-[var(--lms-heading)]">Status history</Heading>
   <DataTable caption="Application status history" mobileMode="scroll"
     columns={[
       {key:"stage",header:"Stage change",mobilePriority:"primary",cell:event=><span className="flex flex-wrap items-center gap-2 font-semibold text-[var(--lms-heading)]">
         {event.fromStage??"New application"} → <StatusBadge tone="info">{event.toStage}</StatusBadge>
       </span>},
       {key:"reason",header:"Reason",mobilePriority:"secondary",cell:event=>event.reason},
       {key:"date",header:"Changed at",mobilePriority:"secondary",cell:event=><time dateTime={event.changedAt.toISOString()}>
         {event.changedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST
       </time>},
     ] satisfies DataTableColumn<NonNullable<typeof history>[number]>[]}
     rows={history??[]} getRowKey={event=>String(event.id)}
     empty={<EmptyState title="No status history" description="No persisted stage transitions recorded yet."/>}/>

  </section>
 </div>;
}
