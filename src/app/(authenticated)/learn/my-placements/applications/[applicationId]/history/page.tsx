import { Tabs } from "@/components/ui/tabs";
import {ErrorState} from "@/components/ui/error-state";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, applicationStatusTone } from "@/components/ui/status-badge";
import { getOwnLearnerApplicationHistory } from "@/modules/placements/learner-application-detail-service";
import { placementApplicationIdSchema } from "@/modules/placements/validation";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";

function dateInIst(value: Date): string {
  if(!Number.isFinite(value.getTime()))return "Date unavailable";
  return istDateTimeFormatter.format(value) + " IST";
}

export default async function LearnerApplicationHistoryPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  if (!placementApplicationIdSchema.safeParse(applicationId).success) {
    notFound();
  }
  const context = await getCurrentRequestContext();
  let history:Awaited<ReturnType<typeof getOwnLearnerApplicationHistory>>;
  let journey:Awaited<ReturnType<typeof getLearnerPlacementJourney>>;
  try{
    [history,journey]=await Promise.all([
      getOwnLearnerApplicationHistory(context,applicationId),
      getLearnerPlacementJourney(context),
    ]);
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Application status history"/>
      <ErrorState title="Couldn't load application status history"
        description="Your saved application has not been changed. Try reloading the authorized status timeline."
        action={<TextLink href={"/learn/my-placements/applications/"+encodeURIComponent(applicationId)+"/history"}
          className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>}/>
    </div>;
  }
  if (!history) notFound();
  const owned=journey.find(item=>item.applicationId===applicationId);
  if(!owned)notFound();
  const baselinePresent=history.events.some(event=>event.toStatus==="SUBMITTED"||
    event.toStatus==="APPLIED");
  const events=[
    ...(!baselinePresent?[{
      id:"baseline-"+applicationId,fromStatus:null,toStatus:history.currentStatus,
      occurredAt:owned.submittedAt,
      label:history.currentStatus==="WITHDRAWN"?"Application withdrawn":
        history.currentStatus==="SUBMITTED"?"Application submitted":"Application status recorded",
    }]:[]),
    ...history.events,
    ...(owned.withdrawnAt&&!history.events.some(event=>event.toStatus==="WITHDRAWN")?[{
      id:"withdrawn-"+applicationId,fromStatus:"SUBMITTED",toStatus:"WITHDRAWN",
      occurredAt:owned.withdrawnAt,label:"Application withdrawn",
    }]:[]),
  ].sort((a,b)=>a.occurredAt.getTime()-b.occurredAt.getTime()||a.id.localeCompare(b.id));

  const stageLabel=(status:string)=>({
    SUBMITTED:"Applied",APPLIED:"Applied",REJECTED:"Not selected",
    WITHDRAWN:"Withdrawn",SHORTLISTED:"Shortlisted",ASSESSMENT:"Test",
    INTERVIEW:"Interview",WAITLISTED:"Waitlisted",OFFERED:"Offered",HIRED:"Placed",
  } as Record<string,string>)[status]??status.replaceAll("_"," ").toLowerCase().replace(/^./,char=>char.toUpperCase());
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title={history.roleTitle}
        description={history.companyName + " · Application status history"}
        actions={<StatusBadge tone={applicationStatusTone(history.currentStatus)}>{stageLabel(history.currentStatus)}</StatusBadge>}
      />
      <Tabs ariaLabel="Placements sections" renderPanel={false} value="/learn/my-placements/applications"
        items={[
          {value:"/learn/my-placements",label:"Home",href:"/learn/my-placements"},
          {value:"/learn/my-placements/jobs",label:"Jobs",href:"/learn/my-placements/jobs"},
          {value:"/learn/my-placements/applications",label:"Applications",href:"/learn/my-placements/applications"},
          {value:"/learn/my-placements/calendar",label:"Schedule",href:"/learn/my-placements/calendar"},
          {value:"/learn/my-placements/offers",label:"Offers",href:"/learn/my-placements/offers"},
        ]}/>
      <TextLink
        href={"/learn/my-placements/applications?applicationId=" +
          encodeURIComponent(history.applicationId)}
        className="inline-flex min-h-11 md:min-h-9 items-center text-sm"
      >
        ← Back to application
      </TextLink>
      <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-4">
        <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Status history</Heading>
        <p className="mt-2 max-w-2xl text-sm leading-[22px] text-body">
          Your timeline includes a submission baseline reconstructed from your own saved application when older history entries are missing. Screening and round decisions remain in your application details.
        </p>
        <ol className="mt-4 divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="min-w-0 py-3 first:pt-0 last:pb-0 sm:py-4">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <p className="m-0 min-w-0 break-words text-sm font-semibold text-foreground leading-[22px]">{event.label}</p>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={Number.isFinite(event.occurredAt.getTime())?event.occurredAt.toISOString():undefined}>
                    {dateInIst(event.occurredAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-body leading-[22px]">
                  {event.fromStatus
                    ? stageLabel(event.fromStatus) + " → "
                    : "Initial status: "}
                  {stageLabel(event.toStatus)}
                </p>
              </li>
            ))}
          </ol>
        <p className="mt-4 text-xs text-muted-foreground leading-5">
          Internal actor identifiers and private change notes are not shown on learner timelines. To clarify a recorded status or withdrawal reason, contact your placement cell.
        </p>
      </section>
    </div>
  );
}
