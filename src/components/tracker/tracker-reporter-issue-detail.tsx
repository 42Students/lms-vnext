import "server-only";

import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {TrackerScreenshotGallery} from "@/components/tracker/tracker-screenshot-gallery";
import {TrackerAdminError} from "@/modules/bug-tracker/admin-errors";
import {
  getMyTrackerReport,listMyTrackerReportHistory,listMyTrackerReportScreenshots,
} from "@/modules/bug-tracker/reporter-service";
import type {RequestContext} from "@/modules/identity/context";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";

function localDate(value:Date){
  return istDateTimeFormatter.format(value);
}

/** A public-looking URL is NOT public authorization. Only the persisted
 * reporterUserId may read a personal report or its metadata.
 */
export async function TrackerReporterIssueDetail({
  context,publicId,
}:{context:RequestContext;publicId:string}){
  let report:Awaited<ReturnType<typeof getMyTrackerReport>>|null=null;
  try{report=await getMyTrackerReport(context,publicId);}
  catch(error){
    if(error instanceof TrackerAdminError && error.code==="ISSUE_NOT_FOUND")notFound();
  }
  if(!report)return <div className="min-w-0 space-y-4">
    <PageHeader title={publicId} description="Issue could not be loaded."/>
    <ErrorState title="Issue could not be loaded."
      description="Your issue details are temporarily unavailable. Retry this report."
      action={<TextLink href={"/tracker/issues/"+encodeURIComponent(publicId)}>Retry issue</TextLink>}/>
  </div>;
  const [historyResult,screenshotsResult]=await Promise.allSettled([
    listMyTrackerReportHistory(context,publicId),
    listMyTrackerReportScreenshots(context,publicId),
  ] as const);
  const activities=historyResult.status==="fulfilled"?historyResult.value:[];
  const screenshots=screenshotsResult.status==="fulfilled"?screenshotsResult.value:[];
  return <article className="min-w-0 space-y-4">
    <PageHeader title={report.publicId}
      description={report.issueType+" · "+report.page}
      actions={<TextLink href="/tracker/mine">← All my reports</TextLink>}/>
    <section className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-4" aria-label="Your reported issue">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={report.status==="CLOSED"?"success":"info"}>{report.status}</StatusBadge>
        <StatusBadge tone={report.severity==="BLOCKER"||report.severity==="CRITICAL"?"error":"warning"}>{report.severity}</StatusBadge>
        <StatusBadge>{report.environment}</StatusBadge>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-body">{report.description}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Location</dt><dd>{[report.page,report.screen,report.section].filter(Boolean).join(" · ")}</dd></div>
        <div><dt className="font-semibold">Reported (IST)</dt><dd>{localDate(report.createdAt)}</dd></div>
        <div><dt className="font-semibold">Updated (IST)</dt><dd>{localDate(report.updatedAt)}</dd></div>
        <div><dt className="font-semibold">Status</dt><dd>{report.status}</dd></div>
      </dl>
      {report.evidenceLink ? <p className="break-all text-xs text-muted-foreground">Evidence reference: {report.evidenceLink}</p>:null}
    </section>
    {historyResult.status==="rejected"? <Alert tone="warning" title="Activity could not be loaded">
      Your status history is temporarily unavailable.
      {" "}<TextLink href={"/tracker/issues/"+encodeURIComponent(publicId)}>Retry activity</TextLink>
    </Alert> : null}
    {historyResult.status==="fulfilled" && activities.length>0 ? <section aria-label="Issue status history" className="space-y-3">
      <Heading level={2}>Activity</Heading>
      <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
        {activities.map(activity=><li key={activity.id} className="py-3 text-sm">
          <p className="font-semibold">{activity.type==="WORKFLOW_UPDATED"?"Engineering update recorded":activity.type.replaceAll("_"," ")}</p>
          {activity.type==="STATUS_CHANGED"||activity.type==="RESOLUTION_CHANGED" ?
            <p className="break-words text-body">{activity.fromValue??"Not set"} → {activity.toValue??"Not set"}</p>:null}
          <p className="text-xs text-muted-foreground">{localDate(activity.createdAt)}</p>
        </li>)}
      </ol>
      {activities.length===50?<p className="text-xs text-muted-foreground">Showing the 50 most recent status-history events.</p>:null}
    </section>:null}
    {screenshotsResult.status==="rejected"?<Alert tone="warning" title="Screenshots could not be loaded right now.">
      Attached screenshot metadata is temporarily unavailable.
      {" "}<TextLink href={"/tracker/issues/"+encodeURIComponent(publicId)}>Retry screenshots</TextLink>
    </Alert>:null}
    {screenshotsResult.status==="fulfilled" && screenshots.length>0 ?
      <section aria-label="Your issue screenshots" className="space-y-2">
        <Heading level={2}>Screenshots</Heading>
        <TrackerScreenshotGallery publicId={report.publicId} screenshots={screenshots}/>
      </section>:null}
    <p className="text-xs text-muted-foreground">This is your own report's read-only status history. Engineering notes and other reporters' issues remain private.</p>
  </article>;
}
