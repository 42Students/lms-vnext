import Link from "next/link";
import {TrackerIssueCopyActions} from "@/components/tracker/tracker-issue-copy-actions";
import {TrackerIssueLogsPanel} from "@/components/tracker/tracker-issue-logs-panel";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import {
  TrackerWorkflowPanel,
  type TrackerWorkflowIssue,
} from "@/components/tracker/tracker-workflow-panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE") redirect("/dashboard");
  const { publicId } = await params;
  if (!trackerPublicIdSchema.safeParse(publicId).success) notFound();
  const cursor = parseTrackerActivityCursorParams(searchParams ? await searchParams : {});
  if (!cursor) notFound();

  if (!trackerAdminRuntimeEnabled()) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="42 Tracker" title={publicId} description="Migration 0076 is registered; tracker runtime activation is pending." />
        <TrackerAdminNav />
        <p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          Apply migration 0076 and verify DB10_TRACKER_READY=DB10_VERIFIED before this page reads tracker data.
        </p>
      </div>
    );
  }

  let detail;
  try {
    detail = await getBugTrackerIssueForAdmin(context, publicId, cursor);
  } catch (error) {
    if (error instanceof TrackerAdminError && error.code === "ISSUE_NOT_FOUND") notFound();
    throw error;
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="42 Tracker"
        title={issue.publicId}
        description={`${issue.issueType} · ${issue.page}`}
        actions={
          <Link href="/tracker/issues" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground">
            Back to issues
          </Link>
        }
      />
      <TrackerAdminNav />

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{issue.status}</StatusBadge>
          <StatusBadge>{issue.severity}</StatusBadge>
          <StatusBadge>{issue.environment}</StatusBadge>
          {issue.resolution ? <StatusBadge>{issue.resolution}</StatusBadge> : null}
        </div>
        <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-body">{issue.description}</p>
        <TrackerIssueCopyActions publicId={issue.publicId} description={issue.description} page={issue.page}/>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
              <a href={issue.evidenceLink} target="_blank" rel="noopener noreferrer"
                className="break-all font-semibold text-primary-text underline">Open linked evidence ↗</a>:
              <span className="break-all text-body">{issue.evidenceLink}</span>}
          </p>
        ) : null}
      </section>

      <TrackerWorkflowPanel issue={workflow} />
      <TrackerIssueLogsPanel publicId={issue.publicId}/>

      <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Screenshots</h2>
        {detail.attachments.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">No screenshot metadata.</p>
        ) : (
          <div className="grid gap-2">
            {detail.attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
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
          }).toString()} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Older screenshot metadata
          </Link>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Activity</h2>
        {detail.activities.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">No workflow history yet.</p>
        ) : (
          <ol className="grid gap-3">
            {detail.activities.map((activity) => (
              <li key={activity.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="m-0 text-sm font-semibold text-foreground">{activity.type}</p>
                <p className="mt-1 text-sm text-body">
                  {auditActivityTransition(activity)}
                </p>
                {activity.note ? <p className="mt-1 whitespace-pre-wrap text-sm text-body">{activity.note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.actorName ?? (activity.actorUserId ? "Platform administrator" : "Authorized tracker reporter")} · {when(activity.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
        {detail.nextActivityCursor ? (
          <Link href={(auditMode ? "/tracker/audit-findings/" : "/tracker/issues/") + encodeURIComponent(publicId) + "?" + new URLSearchParams({
            ...detail.nextActivityCursor,
            ...(cursor.attachmentBeforeCreatedAt && cursor.attachmentBeforeId ? {
              attachmentBeforeCreatedAt:cursor.attachmentBeforeCreatedAt,attachmentBeforeId:cursor.attachmentBeforeId,
            }:{}),
          }).toString()}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Older audit events
          </Link>
        ) : null}
      </section>
    </div>
  );
}
