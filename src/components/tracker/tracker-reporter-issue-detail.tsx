import "server-only";

import Link from "next/link";
import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {TrackerAdminError} from "@/modules/bug-tracker/admin-errors";
import {
  getMyTrackerReport,listMyTrackerReportHistory,listMyTrackerReportScreenshots,
} from "@/modules/bug-tracker/reporter-service";
import type {RequestContext} from "@/modules/identity/context";

function localDate(value:Date){
  return new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(value);
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
      action={<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="font-semibold text-link underline underline-offset-4">Retry issue</Link>}/>
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
      actions={<Link href="/tracker/mine" className="font-semibold text-link underline underline-offset-4">← All my reports</Link>}/>
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
      {" "}<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="underline">Retry activity</Link>
    </Alert> : null}
    {historyResult.status==="fulfilled" && activities.length>0 ? <section aria-label="Issue status history" className="space-y-3">
      <h2 className="font-semibold">Activity</h2>
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
      {" "}<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="underline">Retry screenshots</Link>
    </Alert>:null}
    {screenshotsResult.status==="fulfilled" && screenshots.length>0 ?
      <section aria-label="Your issue screenshots" className="space-y-2">
        <h2 className="font-semibold">Screenshots</h2>
        <ul className="divide-y divide-[var(--lms-canvas-border)]">
          {screenshots.map(file=><li key={file.id} className="py-2 text-sm">
            <span className="break-words font-semibold">{file.originalFilename}</span>
            <span className="ml-2 text-xs text-muted-foreground">{file.contentType} · {Math.ceil(file.sizeBytes/1024)} KiB</span>
          </li>)}
        </ul>
        <p className="text-xs text-muted-foreground">Private storage keys and unsigned file URLs are never displayed.</p>
      </section>:null}
    <p className="text-xs text-muted-foreground">This is your own report's read-only status history. Engineering notes and other reporters' issues remain private.</p>
  </article>;
}
