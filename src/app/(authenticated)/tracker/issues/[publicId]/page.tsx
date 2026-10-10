import Link from "next/link";
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
import { isSuperAdmin } from "@/modules/identity/context";

function when(value: Date) {
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default async function TrackerIssueDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  const { publicId } = await params;

  if (!trackerAdminRuntimeEnabled()) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="42 Tracker" title={publicId} description="Tracker database activation is pending." />
        <TrackerAdminNav />
        <p className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          DB10 tracker migrations are not verified yet. No issue query was executed.
        </p>
      </div>
    );
  }

  let detail;
  try {
    detail = await getBugTrackerIssueForAdmin(context, publicId);
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
            Evidence: <span className="break-all text-body">{issue.evidenceLink}</span>
          </p>
        ) : null}
      </section>

      <TrackerWorkflowPanel issue={workflow} />

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
                  {[activity.fromValue, activity.toValue].filter(Boolean).join(" → ") || activity.note || "Workflow update"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{when(activity.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
