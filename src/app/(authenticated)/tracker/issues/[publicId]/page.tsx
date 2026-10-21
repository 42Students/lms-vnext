import Link from "next/link";
import {TrackerIssueCopyActions} from "@/components/tracker/tracker-issue-copy-actions";
import {TrackerReporterIssueDetail} from "@/components/tracker/tracker-reporter-issue-detail";
import {Alert} from "@/components/ui/alert";
import {TrackerIssueLogsPanel} from "@/components/tracker/tracker-issue-logs-panel";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import {
  TrackerWorkflowPanel,
  type TrackerWorkflowIssue,
} from "@/components/tracker/tracker-workflow-panel";
import { PageHeader } from "@/components/ui/page-header";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { TrackerAdminError } from "@/modules/bug-tracker/admin-errors";
import { getBugTrackerIssueForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { trackerPublicIdSchema } from "@/modules/bug-tracker/admin-validation";
import { isSuperAdmin } from "@/modules/identity/context";

import {parseTrackerActivityCursorParams} from "@/modules/bug-tracker/admin-detail-cursor-model";

function when(value: Date) {
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

const STATUS_TEXT:Record<string,string>={
 NEW:"New",CHECKING:"Checking",FIXING:"Fixing",READY_FOR_RETEST:"Ready for Retest",CLOSED:"Closed",
};
const RESOLUTION_TEXT:Record<string,string>={
 FIXED:"Fixed",DUPLICATE:"Duplicate",NOT_A_BUG:"Not a Bug",
 CANNOT_REPRODUCE:"Cannot Reproduce",WONT_FIX:"Won't Fix",
};
const SEVERITY_TEXT:Record<string,string>={
 BLOCKER:"Blocker",CRITICAL:"Critical",MAJOR:"Major",MINOR:"Minor",
 UI_ONLY:"UI Only",SUGGESTION:"Suggestion",NOT_SURE:"Not Sure",
};
const ACCOUNT_TEXT:Record<string,string>={
 LEARNER:"Learner / Student",FACULTY:"Faculty / Teacher",MENTOR:"Mentor",
 COLLEGE_ADMIN:"College Admin",SUPER_ADMIN:"Super Admin",NOT_SURE:"Not Sure",
};
const ENVIRONMENT_TEXT:Record<string,string>={
 LOCAL:"Local",DEVELOPMENT:"Development",UAT:"UAT",PRODUCTION:"Production",
 OTHER:"Other",NOT_SURE:"Not Sure",
};
function legacyLabel(value:string|null|undefined,labels:Record<string,string>,fallback="Unknown"){
 return value?labels[value]??value:fallback;
}
function trackerActivityText(event:{type:string;fromValue:string|null;toValue:string|null}){
 if(event.type==="RETEST"||event.type==="RETEST_COMPLETED"){
  return event.toValue==="CLOSED / FIXED"||event.toValue==="PASS"?
   "Retest passed — issue closed":"Retest failed — returned to Fixing";
 }
 if(event.type==="STATUS_CHANGED"){
  return "Status changed from "+legacyLabel(event.fromValue,STATUS_TEXT)+
   " to "+legacyLabel(event.toValue,STATUS_TEXT);
 }
 if(event.type==="RESOLUTION_CHANGED"){
  return "Resolution changed from "+legacyLabel(event.fromValue,RESOLUTION_TEXT,"None")+
   " to "+legacyLabel(event.toValue,RESOLUTION_TEXT,"None");
 }
 return event.type.replaceAll("_"," ")||"Activity";
}

export async function generateMetadata({params}:{params:Promise<{publicId:string}>}){
 const {publicId}=await params;
 return {title:publicId+" · 42 Tracker"};
}
export default async function TrackerIssueDetailPage({
  params,
  searchParams,
  auditMode = false,
}: {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<Record<string,string|string[]|undefined>>;
  auditMode?: boolean;
}) {
  const context = await getCurrentRequestContext();
  if (context.user.platformStatus !== "ACTIVE") redirect("/dashboard");
  const { publicId } = await params;
  if (!trackerPublicIdSchema.safeParse(publicId).success) notFound();
  if (!trackerAdminRuntimeEnabled()) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader title={publicId} description="The tracker is temporarily unavailable." />
        {isSuperAdmin(context)?<TrackerAdminNav/>:null}
        <ErrorState title="Issue details unavailable"
          description="We could not load tracker details right now. Please try again later." />
      </div>
    );
  }

  if (!isSuperAdmin(context)) {
    return <TrackerReporterIssueDetail context={context} publicId={publicId}/>;
  }
  const cursor = parseTrackerActivityCursorParams(searchParams ? await searchParams : {});
  if (!cursor) notFound();

  let detail;
  try {
    detail = await getBugTrackerIssueForAdmin(context, publicId, cursor);
  } catch (error) {
    if (error instanceof TrackerAdminError && error.code === "ISSUE_NOT_FOUND") notFound();
    if (error instanceof AuthorizationError || (error instanceof TrackerAdminError && error.code==="FORBIDDEN")) throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title={publicId} description="Issue could not be loaded." />
      <TrackerAdminNav />
      <ErrorState title="Issue could not be loaded."
        description="The issue details could not be refreshed. The report was not modified."
        action={<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="font-semibold text-link underline underline-offset-4">Retry issue</Link>} />
    </div>;
  }

  const issue = detail.report;
  const workflow: TrackerWorkflowIssue = {
    publicId: issue.publicId,
    version: issue.version,
    status: issue.status,
    resolution: issue.resolution,
    affectedLayer: issue.affectedLayer,
    rootCause: issue.rootCause,
    fixNotes: issue.fixNotes,
    frontendCommitSha: issue.frontendCommitSha,
    backendCommitSha: issue.backendCommitSha,
    regressionTestStatus: issue.regressionTestStatus,
    productionVerified: issue.productionVerified,
    retestStatus: issue.retestStatus,
  };

  return (
    <div className="min-w-0 space-y-4">
      <Link href="/tracker/issues"
        className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">← All issues</Link>
      <header className="flex min-w-0 flex-col justify-between gap-4 border-b border-border pb-4 lg:flex-row">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span>{issue.publicId}</span>
            <TrackerIssueCopyActions publicId={issue.publicId} description={issue.description} page={issue.page}/>
            <StatusBadge tone={issue.severity==="BLOCKER"||issue.severity==="CRITICAL"?"error":
              issue.severity==="MAJOR"?"warning":"neutral"}>{legacyLabel(issue.severity,SEVERITY_TEXT)}</StatusBadge>
            <StatusBadge tone={issue.status==="CLOSED"?"success":
              issue.status==="NEW"?"warning":"info"}>{legacyLabel(issue.status,STATUS_TEXT)}</StatusBadge>
            {issue.resolution?<StatusBadge>{legacyLabel(issue.resolution,RESOLUTION_TEXT)}</StatusBadge>:null}
          </div>
          <h1 className="m-0 max-w-4xl break-words text-xl font-semibold text-foreground sm:text-2xl">
            {[issue.page,issue.screen,issue.section].filter(Boolean).join(" › ")||"Unknown location"}
          </h1>
          <p className="text-sm text-muted-foreground">Reported by {issue.reporterName} · {when(issue.createdAt)}</p>
        </div>
        <div className="flex min-w-40 shrink-0 items-start gap-2 lg:flex-col">
          <span className="text-xs font-semibold text-muted-foreground">Status</span>
          <a href="#tracker-workflow" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link underline"
            aria-label={"Change issue status, currently "+legacyLabel(issue.status,STATUS_TEXT)}>
            {legacyLabel(issue.status,STATUS_TEXT)} ↓
          </a>
        </div>
      </header>
      <TrackerAdminNav/>
      {issue.status==="READY_FOR_RETEST"?<section aria-label="Ready for retest" className="rounded-[var(--lms-control-radius)] border border-border p-4">
        <h2 className="font-semibold">Ready for retest</h2>
        <p className="mt-1 text-sm text-body">Does it work now? Confirm the same flow, then use the retest controls under Engineering details.</p>
        <a href="#tracker-workflow" className="mt-2 inline-flex min-h-9 items-center font-semibold text-link underline">Retest this issue ↓</a>
      </section>:null}
      <section aria-label="What went wrong" className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What went wrong</p>
        <p className="mt-2 max-w-3xl whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{issue.description}</p>
      </section>
      {(detail.attachments.length>0||detail.attachmentsUnavailable||Boolean(issue.evidenceLink))?
        <section aria-label="Evidence" className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</h2>
          {detail.attachmentsUnavailable?<Alert tone="warning">Screenshots could not be loaded right now. The report remains available.
            {" "}<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="text-link underline">Retry screenshots</Link>
          </Alert>:null}
          {detail.attachments.length?<div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.attachments.map((attachment,index)=><div key={attachment.id}
              className="flex min-w-0 flex-col justify-between gap-3 rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
              <div className="min-h-24 rounded bg-muted p-3">
                <p className="break-words font-semibold">{attachment.originalFilename||`Screenshot ${index+1}`}</p>
                <span className="mt-2 block text-xs text-muted-foreground">Preview unavailable</span>
              </div>
              <p className="text-xs text-muted-foreground">{attachment.contentType} · {
                Math.ceil(attachment.sizeBytes/1024)} KiB · {when(attachment.createdAt)}</p>
            </div>)}
          </div>:null}
          {issue.evidenceLink?<div className="mt-3 text-sm">
            {/^https:\/\/[^\s]+$/i.test(issue.evidenceLink)?
              <ThirdPartyLink href={issue.evidenceLink} label="Open linked evidence ↗"/>:
              <span className="break-all text-muted-foreground">
                {/^http:\/\/[^\s]+$/i.test(issue.evidenceLink)?
                  "HTTP evidence links must be opened outside this secure workspace: ":"Evidence link: "}
                {issue.evidenceLink}
              </span>}
          </div>:null}
          <p className="mt-3 text-xs text-muted-foreground">
            Private screenshots have no public URL. Preview stays unavailable until an authorized signed-image route is provided.
          </p>
        </section>:null}
      <section aria-label="Issue details" className="rounded-[var(--lms-control-radius)] border border-border p-4">
        <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["Reporter",issue.reporterName],
            ["Account",legacyLabel(issue.accountRole,ACCOUNT_TEXT)],
            ["Environment",legacyLabel(issue.environment,ENVIRONMENT_TEXT)],
            ["Issue type",issue.issueType],
            ["Severity",legacyLabel(issue.severity,SEVERITY_TEXT)],
            ["Status",legacyLabel(issue.status,STATUS_TEXT)],
          ] as const).map(([name,value])=><div key={name}>
            <dt className="text-xs font-semibold text-muted-foreground">{name}</dt>
            <dd className="mt-1 break-words font-semibold text-foreground">{value}</dd>
          </div>)}
        </dl>
      </section>
      <TrackerIssueLogsPanel publicId={issue.publicId}/>
      <section id="tracker-workflow" aria-label="Engineering details" className="scroll-mt-12">
        <TrackerWorkflowPanel issue={workflow}/>
        <details className="border-b border-border pb-3">
          <summary className="min-h-9 cursor-pointer font-semibold text-link">Report technical context</summary>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt>Source path</dt><dd className="break-all">{issue.sourcePath??"—"}</dd></div>
            <div><dt>Browser</dt><dd className="break-all">{issue.browser??"—"}</dd></div>
            <div><dt>Viewport</dt><dd>{issue.viewport??"—"}</dd></div>
          </dl>
        </details>
      </section>

      {detail.activityUnavailable ? <Alert tone="warning" title="Activity could not be loaded">
        Workflow events are temporarily unavailable; the issue details are still visible.
        {" "}<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="font-semibold underline underline-offset-4">Retry activity</Link>
      </Alert> : null}
      {!detail.activityUnavailable&&detail.activities.length>0?
        <section aria-label="Activity" className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h2>
          <ol className="mt-3 space-y-1 border-l-2 border-border pl-5">
            {[...detail.activities].reverse().map(activity=><li key={activity.id}
              className="relative py-3">
              <span aria-hidden="true" className="absolute -left-[1.7rem] top-4 h-3 w-3 rounded-full border-2 border-primary bg-surface"/>
              <p className="text-sm font-semibold text-foreground">{trackerActivityText(activity)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activity.actorName??(activity.actorUserId?"Engineering":"Authorized tracker reporter")} · {when(activity.createdAt)}
              </p>
              {activity.note?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{activity.note}</p>:null}
            </li>)}
          </ol>
          {detail.nextActivityCursor?<Link href={(auditMode?"/tracker/audit-findings/":"/tracker/issues/")+
            encodeURIComponent(publicId)+"?"+new URLSearchParams({
              ...detail.nextActivityCursor,
              ...(cursor.attachmentBeforeCreatedAt&&cursor.attachmentBeforeId?{
                attachmentBeforeCreatedAt:cursor.attachmentBeforeCreatedAt,attachmentBeforeId:cursor.attachmentBeforeId,
              }:{}),
            }).toString()} className="inline-flex min-h-9 items-center font-semibold text-link underline">
            Older audit events
          </Link>:null}
        </section>:null}

    </div>
  );
}
