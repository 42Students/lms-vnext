import Link from "next/link";
import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import {ProjectAdminSubmissionReview} from "@/components/projects/project-admin-submission-review";
import {listProjectAdminUnsubmitted} from "@/modules/projects/admin-unsubmitted-service";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listProjectAdminSubmissionQueue,
  getProjectAdminSubmissionSummary,
} from "@/modules/projects/admin-insights-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function tone(status: string) {
  if (status === "APPROVED") {
    return "success" as const;
  }
  if (status === "SUBMITTED") {
    return "warning" as const;
  }
  if (status === "CHANGES_REQUESTED") {
    return "warning" as const;
  }
  return "info" as const;
}

function formatDate(
  value: Date | null,
) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export async function ProjectAdminSubmissionsPage({
  collegeId,
  basePath,
  eyebrow,
  searchParams,
}: {
  collegeId: string;
  basePath: string;
  eyebrow: string;
  searchParams: Record<
    string,
    string | string[] | undefined
  >;
}) {
  const context = await getCurrentRequestContext();
  const view=one(searchParams.view)==="NOT_SUBMITTED"?"NOT_SUBMITTED":"ALL";
  const query: ProjectAdminCollectionQuery = {
    q: one(searchParams.q),
    status: one(searchParams.status) as ProjectAdminCollectionQuery["status"],
    submissionStatus: one(
      searchParams.submissionStatus,
    ) as ProjectAdminCollectionQuery["submissionStatus"],
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };
  const [result, summary] = await Promise.all([
    listProjectAdminSubmissionQueue(context, collegeId, query),
    getProjectAdminSubmissionSummary(context, collegeId),
  ]);
  const queuePath =
    basePath + "/submissions";
  const renderedAt = new Date();
  const unsubmitted=view==="NOT_SUBMITTED"?await listProjectAdminUnsubmitted(context,collegeId,{
    q:query.q,page:query.page,pageSize:query.pageSize,
  }):null;

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="submissions"
      />
      <PageHeader
        eyebrow={eyebrow}
        title="Project submissions"
        description="Final-delivery versions across project workspaces, newest activity first."
      />

      <nav aria-label="Submission categories" className="flex flex-wrap gap-3 text-sm font-semibold">
        <Link href={queuePath} aria-current={view==="ALL"?"page":undefined}
          className="min-h-10 rounded border border-border px-3 py-2 text-primary-text">All submissions</Link>
        <Link href={queuePath+"?view=NOT_SUBMITTED"} aria-current={view==="NOT_SUBMITTED"?"page":undefined}
          className="min-h-10 rounded border border-border px-3 py-2 text-primary-text">Not submitted</Link>
      </nav>
      {unsubmitted?<section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold">Not submitted · {unsubmitted.total} workspaces</h2>
        {unsubmitted.items.length?<div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
          <thead><tr><th className="p-2">Workspace</th><th className="p-2">Status</th>
            <th className="p-2">Progress</th><th className="p-2">Inactive</th><th className="p-2">Action</th></tr></thead>
          <tbody>{unsubmitted.items.map(row=><tr key={row.id} className="border-t border-border">
            <td className="p-2 font-semibold">{row.title}</td><td className="p-2">{row.status}</td>
            <td className="p-2">{row.progressPercent}%</td>
            <td className="p-2">{Math.max(0,Math.floor((renderedAt.getTime()-row.updatedAt.getTime())/86400000))} days</td>
            <td className="p-2"><Link href={basePath+"/"+row.id+"/delivery"}
              className="text-primary-text underline">Open</Link></td>
          </tr>)}</tbody>
        </table></div>:<p className="text-sm text-muted-foreground">All matching workspaces have a submission.</p>}
        <div className="flex flex-wrap gap-3 text-sm">
          {unsubmitted.page>1?<Link href={queuePath+"?view=NOT_SUBMITTED&page="+(unsubmitted.page-1)}
           className="text-primary-text underline">Previous</Link>:null}
          <span>Page {unsubmitted.page} of {unsubmitted.totalPages}</span>
          {unsubmitted.page<unsubmitted.totalPages?<Link href={queuePath+"?view=NOT_SUBMITTED&page="+(unsubmitted.page+1)}
           className="text-primary-text underline">Next</Link>:null}
        </div>
      </section>:null}
      {view==="ALL"?<>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ["Active workspaces", summary.activeWorkspaces, "status", "ACTIVE"],
          ["Pending review", summary.pendingReview, "submissionStatus", "SUBMITTED"],
          ["Needs student action", summary.needsStudentAction, "submissionStatus", "CHANGES_REQUESTED"],
          ["Reviewed", summary.reviewed, "submissionStatus", "APPROVED"],
        ] as const).map(([name, value, key, filter]) => {
          const params = new URLSearchParams();
          params.set(key, filter);
          return <Link key={name} href={queuePath + "?" + params.toString()}
            className="rounded-xl border border-border bg-surface p-4 hover:border-primary">
            <p className="text-xs font-semibold text-muted-foreground">{name}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </Link>;
        })}
      </div>
      <ProjectAdminFilters
        query={query}
        includeSubmissionStatus
      />

      {!result.items.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No final-delivery versions match these filters.
        </section>
      ) : (
        <div className="space-y-3">
          {result.items.map((submission) => (
            <article
              key={submission.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={
                      basePath +
                      "/" +
                      submission.projectId +
                      "/delivery"
                    }
                    className="text-base font-semibold text-foreground hover:text-primary-text"
                  >
                    {submission.projectTitle}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Version {submission.version} ·{" "}
                    {formatDate(
                      submission.submittedAt,
                    )}
                  </p>
                </div>
                <StatusBadge
                  tone={tone(submission.status)}
                >
                  {submission.lockedAt?"Locked":submission.status}
                </StatusBadge>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-body sm:grid-cols-3">
                <div><dt className="font-semibold">Pending</dt><dd>{
                  submission.status === "SUBMITTED" && submission.submittedAt
                    ? Math.max(0, Math.floor((renderedAt.getTime() - submission.submittedAt.getTime()) / 86400000)) + " days"
                    : "—"
                }</dd></div>
                <div><dt className="font-semibold">Revisions</dt>
                  <dd>{Math.max(0, submission.version - 1)}</dd></div>
                <div><dt className="font-semibold">Reviewed by</dt>
                  <dd>{submission.reviewedBy ?? "—"}</dd></div>
              </dl>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">{submission.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {([submission.sourceUrl, submission.demoUrl] as const).map((candidate, i) => {
                  const href = safeProjectExternalHref(candidate);
                  return href ? <a href={href} key={i} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-primary-text hover:underline">Open link</a> : null;
                })}
                {submission.attachments.map((item, index) => {
                  if (!item || typeof item !== "object") return null;
                  const entry = item as Record<string, unknown>;
                  const href = typeof entry.url === "string" ? safeProjectExternalHref(entry.url) : null;
                  return href ? <a key={"evidence-" + index} href={href} target="_blank"
                    rel="noopener noreferrer" className="font-semibold text-primary-text hover:underline">
                    Open {entry.kind === "FILE" ? "file" : "link"}
                  </a> : <span key={"evidence-" + index} className="text-muted-foreground">
                    File · {typeof entry.name === "string" ? entry.name : "Evidence"}
                  </span>;
                })}
              </div>
              <ProjectAdminSubmissionReview
                projectId={submission.projectId} submissionId={submission.id}
                status={submission.status} locked={!!submission.lockedAt}
                projectStatus={submission.projectStatus} />
              <Link
                href={
                  basePath +
                  "/" +
                  submission.projectId +
                  "/delivery"
                }
                className="mt-3 inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
              >
                Open delivery review →
              </Link>
            </article>
          ))}
        </div>
      )}

      <ProjectAdminPagination
        basePath={queuePath}
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
      </>:null}
    </div>
  );
}
