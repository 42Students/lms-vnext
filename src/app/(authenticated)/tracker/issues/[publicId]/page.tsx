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
import { auditActivityTransition } from "@/modules/bug-tracker/audit-activity-display-model";
import {parseTrackerActivityCursorParams} from "@/modules/bug-tracker/admin-detail-cursor-model";

function when(value: Date) {
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
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
      <PageHeader
        title={issue.publicId}
        description={`${issue.issueType} · ${issue.page}`}
        actions={
          <Link href="/tracker/issues" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Back to issues
          </Link>
        }
      />
      <TrackerAdminNav />

      <section className="min-w-0 space-y-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={issue.status==="CLOSED"?"success":issue.status==="NEW"?"warning":"info"}>{issue.status}</StatusBadge>
          <StatusBadge tone={issue.severity==="BLOCKER"||issue.severity==="CRITICAL"?"error":issue.severity==="MAJOR"?"warning":"neutral"}>{issue.severity}</StatusBadge>
          <StatusBadge>{issue.environment}</StatusBadge>
          {issue.resolution ? <StatusBadge>{issue.resolution}</StatusBadge> : null}
        </div>
        <p className="m-0 max-w-3xl whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{issue.description}</p>
        <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text md:min-h-9">Report context</summary>
          <div className="min-w-0 space-y-3 pt-3">
        <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div><dt className="font-semibold text-muted-foreground">Reporter</dt><dd className="m-0">{issue.reporterName} · {issue.accountRole}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Location</dt><dd className="m-0">{[issue.page, issue.screen, issue.section].filter(Boolean).join(" · ")}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Created</dt><dd className="m-0">{when(issue.createdAt)}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Source path</dt><dd className="m-0 break-all">{issue.sourcePath ?? "—"}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Browser</dt><dd className="m-0 break-all">{issue.browser ?? "—"}</dd></div>
          <div><dt className="font-semibold text-muted-foreground">Viewport</dt><dd className="m-0">{issue.viewport ?? "—"}</dd></div>
        </dl>
        {issue.evidenceLink ? (
          <p className="text-sm">
            Evidence: {/^(https:\/\/)[^\s]+$/i.test(issue.evidenceLink) ?
              <ThirdPartyLink href={issue.evidenceLink} label="Open linked evidence ↗" />:
              <span className="break-all text-body">{issue.evidenceLink}</span>}
          </p>
        ) : null}
          </div>
        </details>
        <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text md:min-h-9">Issue sharing</summary>
          <div className="min-w-0 pt-3">
        <TrackerIssueCopyActions publicId={issue.publicId} description={issue.description} page={issue.page}/>
          </div>
        </details>
      </section>

      <TrackerWorkflowPanel issue={workflow} />
      <TrackerIssueLogsPanel publicId={issue.publicId}/>

      {detail.activityUnavailable ? <Alert tone="warning" title="Activity could not be loaded">
        Workflow events are temporarily unavailable; the issue details are still visible.
        {" "}<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="font-semibold underline underline-offset-4">Retry activity</Link>
      </Alert> : null}
      {!detail.activityUnavailable && detail.activities.length>0 ? <details open className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <summary className="flex min-h-11 cursor-pointer items-center text-base font-semibold text-foreground md:min-h-9">Activity</summary>
        <ol className="divide-y divide-border border-y border-border">
            {detail.activities.map((activity) => (
              <li key={activity.id} className="py-4">
                <p className="m-0 text-sm font-semibold text-foreground">{activity.type}</p>
                <p className="mt-1 text-sm text-body">
                  {auditActivityTransition(activity)}
                </p>
                {activity.note ? <p className="mt-1 max-w-3xl whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-body">{activity.note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.actorName ?? (activity.actorUserId ? "Platform administrator" : "Authorized tracker reporter")} · {when(activity.createdAt)}
                </p>
              </li>
            ))}
        </ol>
        {detail.nextActivityCursor ? (
          <Link href={(auditMode ? "/tracker/audit-findings/" : "/tracker/issues/") + encodeURIComponent(publicId) + "?" + new URLSearchParams({
            ...detail.nextActivityCursor,
            ...(cursor.attachmentBeforeCreatedAt && cursor.attachmentBeforeId ? {
              attachmentBeforeCreatedAt:cursor.attachmentBeforeCreatedAt,attachmentBeforeId:cursor.attachmentBeforeId,
            }:{}),
          }).toString()}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Older audit events
          </Link>
        ) : null}
      </details> : null}
      {detail.attachmentsUnavailable ? <Alert tone="warning" title="Screenshots could not be loaded right now.">
        Screenshot metadata could not be refreshed. The issue and activity remain available.
        {" "}<Link href={"/tracker/issues/"+encodeURIComponent(publicId)} className="font-semibold underline underline-offset-4">Retry screenshots</Link>
      </Alert> : null}
      {!detail.attachmentsUnavailable ? <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <summary className="flex min-h-11 cursor-pointer items-center text-base font-semibold text-foreground md:min-h-9">Screenshots</summary>
        {detail.attachments.length === 0 ? (
          <p className="border-y border-border py-4 text-sm text-muted-foreground">No screenshot metadata.</p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {detail.attachments.map((attachment) => (
              <div key={attachment.id} className="py-4 text-sm">
                <p className="m-0 font-semibold text-foreground">{attachment.originalFilename}</p>
                <p className="mt-1 text-muted-foreground">
                  {attachment.contentType} · {Math.ceil(attachment.sizeBytes / 1024)} KiB · {when(attachment.createdAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Private object key and unsigned download URL are intentionally not returned.</p>
              </div>
            ))}
          </div>
        )}
        {detail.nextAttachmentCursor ? (
          <Link href={(auditMode ? "/tracker/audit-findings/" : "/tracker/issues/") + encodeURIComponent(publicId) + "?" + new URLSearchParams({
            ...detail.nextAttachmentCursor,
            ...(cursor.activityBeforeCreatedAt && cursor.activityBeforeId ? {
              activityBeforeCreatedAt:cursor.activityBeforeCreatedAt,activityBeforeId:cursor.activityBeforeId,
            }:{}),
          }).toString()} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Older screenshot metadata
          </Link>
        ) : null}
      </details> : null}

    </div>
  );
}
