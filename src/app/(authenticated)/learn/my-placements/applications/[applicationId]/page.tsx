import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import { AuthorizationError } from "@/modules/permissions/policy";
import { StatusBadge, applicationStatusTone } from "@/components/ui/status-badge";
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
  let record:Awaited<ReturnType<typeof getOwnLearnerApplicationHistory>>;
  try {
    record=await getOwnLearnerApplicationHistory(context,applicationId);
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Application details" />
      <ErrorState title="Could not load application details"
        description="Your recorded application status is unavailable. No changes were made."
        action={<Link href={"/learn/my-placements/applications/"+encodeURIComponent(applicationId)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry application details</Link>} />
    </div>;
  }
  if(!record)notFound();
  const scheduled=await readOptionalLearnerPlacementSource(()=>getLearnerPlacementRequestWorkspace(context));
  const requiresRequest=!scheduled.available || scheduled.value.rounds.some(
    round=>round.applicationId===applicationId,
  );
  return <div className="min-w-0 space-y-6">
    <Link href="/learn/my-placements/applications"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text md:min-h-9">← Applications</Link>
    <PageHeader title={record.roleTitle}
      description={record.companyName+" · Own application status and timeline"}
      actions={<StatusBadge tone={applicationStatusTone(record.currentStatus)}>{record.currentStatus.replaceAll("_"," ")}</StatusBadge>}/>
    {!scheduled.available ? <Banner tone="warning" role="status">
      Round bookings could not be checked. Withdrawal is temporarily restricted to a placement-cell review for your safety.
      <Link href={"/learn/my-placements/applications/"+encodeURIComponent(applicationId)} className="ml-2 font-semibold underline">Retry round bookings</Link>
    </Banner> : null}
    <section className="border-b border-border py-4 md:py-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Application actions</h2>
        {record.currentStatus==="SUBMITTED"
          ? <LearnerApplicationDetailWithdraw applicationId={record.applicationId} requiresRequest={requiresRequest}/>
          : <p className="text-sm text-muted-foreground leading-[22px]">Withdrawal unavailable in the current status.</p>}
      </div>
      <p className="mt-2 text-sm text-body leading-[22px]">
        {requiresRequest?"A booked round requires the placement cell to review your withdrawal request. Your application stays active until approved.":"Withdrawing requires a reason and confirmation. Only a successful response updates your status."}
      </p>
      <Link href={"/learn/my-placements/applications/"+encodeURIComponent(record.applicationId)+"/company"}
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text md:min-h-9">
        View recorded company details →
      </Link>
    </section>
    <section className="border-b border-border py-4 md:py-6" aria-label="Recorded application timeline">
      <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Status timeline</h2>
      <p className="mt-2 max-w-2xl text-sm leading-[22px] text-body">
        Only persisted application status changes are listed. Internal notes and actor IDs are withheld.
        Screening and interview decisions appear in your placement journey.
      </p>
      {record.events.length?<ol className="mt-4 divide-y divide-border">
        {record.events.map(event=><li key={event.id} className="min-w-0 py-3 first:pt-0 last:pb-0 sm:py-4">
          <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h3 className="min-w-0 break-words font-semibold text-[16px] leading-[1.4] text-[var(--lms-heading)]">{event.label}</h3>
            <time className="text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>{when(event.occurredAt)}</time>
          </div>
          <p className="mt-2 text-sm text-body leading-[22px]">
            {event.fromStatus?event.fromStatus.replaceAll("_"," ")+" → ":"Initial: "}
            {event.toStatus.replaceAll("_"," ")}
          </p>
        </li>)}
      </ol>:<p role="status" className="mt-4 text-sm text-muted-foreground leading-[22px]">
        No status-history records yet. Your current persisted status is shown above.
      </p>}
    </section>
  </div>;
}
