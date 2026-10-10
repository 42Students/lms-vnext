import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listProjectAdminSubmissionQueue,
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
  const query: ProjectAdminCollectionQuery = {
    q: one(searchParams.q),
    status: one(searchParams.status),
    submissionStatus: one(
      searchParams.submissionStatus,
    ),
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };
  const result =
    await listProjectAdminSubmissionQueue(
      context,
      collegeId,
      query,
    );
  const queuePath =
    basePath + "/submissions";

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
      <section className="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm leading-6 text-body">
        Legacy delivery supports Under Review, Locked and
        Reopen states. DB07 vNext cannot represent those
        states yet, so this queue reports only persisted
        DRAFT/SUBMITTED/CHANGES_REQUESTED/APPROVED values
        until the staged delivery-event/state work is
        promoted.
      </section>
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
                  {submission.status}
                </StatusBadge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
                {submission.summary}
              </p>
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
    </div>
  );
}
