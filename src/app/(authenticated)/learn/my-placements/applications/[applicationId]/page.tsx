import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LearnerApplicationDetailWithdraw } from "@/components/placements/learner-application-detail-withdraw";
import { getOwnLearnerApplicationHistory } from "@/modules/placements/learner-application-detail-service";
import { placementApplicationIdSchema } from "@/modules/placements/validation";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";

function when(date:Date) {
  return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(date)+" IST";
}
export default async function LearnerApplicationDetailPage({params}:{
  params:Promise<{applicationId:string}>;
}) {
  const {applicationId}=await params;
  if(!placementApplicationIdSchema.safeParse(applicationId).success)notFound();
  const context=await getCurrentRequestContext();
  const record=await getOwnLearnerApplicationHistory(context,applicationId);
  if(!record)notFound();
  const scheduled=await readOptionalLearnerPlacementSource(()=>getLearnerPlacementRequestWorkspace(context));
  const requiresRequest=!scheduled.available || scheduled.value.rounds.some(
    round=>round.applicationId===applicationId,
  );
  return <div className="min-w-0 space-y-6">
    <Link href="/learn/my-placements/applications"
      className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text">← Applications</Link>
    <PageHeader eyebrow="My Placements" title={record.roleTitle}
      description={record.companyName+" · Own application status and timeline"}
      actions={<StatusBadge>{record.currentStatus.replaceAll("_"," ")}</StatusBadge>}/>
    <section className="border-b border-border py-4 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Application actions</h2>
        {record.currentStatus==="SUBMITTED"
          ? <LearnerApplicationDetailWithdraw applicationId={record.applicationId} requiresRequest={requiresRequest}/>
          : <p className="text-sm text-muted-foreground">Withdrawal unavailable in the current status.</p>}
      </div>
      <p className="mt-2 text-sm text-body">
        {requiresRequest?"A booked round requires the placement cell to review your withdrawal request. Your application stays active until approved.":"Withdrawing requires a reason and confirmation. Only a successful response updates your status."}
      </p>
      <Link href={"/learn/my-placements/applications/"+encodeURIComponent(record.applicationId)+"/company"}
        className="mt-4 inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text">
        View recorded company details →
      </Link>
    </section>
    <section className="border-b border-border py-4 sm:py-6" aria-label="Recorded application timeline">
      <h2 className="text-base font-semibold text-foreground">Status timeline</h2>
      <p className="mt-2 text-sm text-body">
        Only persisted application status changes are listed. Internal notes and actor IDs are withheld.
        Screening and interview decisions appear in your placement journey.
      </p>
      {record.events.length?<ol className="mt-4 space-y-3">
        {record.events.map(event=><li key={event.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{event.label}</h3>
            <time className="text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>{when(event.occurredAt)}</time>
          </div>
          <p className="mt-2 text-sm text-body">
            {event.fromStatus?event.fromStatus.replaceAll("_"," ")+" → ":"Initial: "}
            {event.toStatus.replaceAll("_"," ")}
          </p>
        </li>)}
      </ol>:<p role="status" className="mt-4 text-sm text-muted-foreground">
        No status-history records yet. Your current persisted status is shown above.
      </p>}
    </section>
  </div>;
}
