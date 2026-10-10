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
  listProjectAdminSnapshots,
} from "@/modules/projects/admin-insights-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function tone(status: string) {
  if (
    status === "COMPLETED" ||
    status === "APPROVED"
  ) {
    return "success" as const;
  }
  if (
    status === "ACTIVE" ||
    status === "SUBMITTED"
  ) {
    return "info" as const;
  }
  if (
    status === "ARCHIVED"
  ) {
    return "neutral" as const;
  }
  return "warning" as const;
}

export async function ProjectAdminReadinessPage({
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
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };
  const result =
    await listProjectAdminSnapshots(
      context,
      collegeId,
      query,
    );
  const readinessPath =
    basePath + "/readiness";

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="readiness"
      />
      <PageHeader
        eyebrow={eyebrow}
        title="Submission readiness"
        description="Execution completion and final-delivery readiness across project workspaces."
      />
      <section className="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm leading-6 text-body">
        The legacy manual readiness override is not yet
        persisted in the vNext DB07 schema. This page shows
        authoritative execution/readiness state, but does
        not fabricate an override control until that
        persisted contract is implemented.
      </section>
      <ProjectAdminFilters query={query} />

      {!result.items.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No project workspaces match these filters.
        </section>
      ) : (
        <div className="space-y-3">
          {result.items.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={
                      basePath +
                      "/" +
                      project.id +
                      "/readiness"
                    }
                    className="text-base font-semibold text-foreground hover:text-primary-text"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.mentorName
                      ? "Mentor: " +
                        project.mentorName
                      : "No primary mentor"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    tone={tone(project.status)}
                  >
                    {project.status}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      project.executionComplete
                        ? "success"
                        : "warning"
                    }
                  >
                    {project.executionComplete
                      ? "Execution complete"
                      : "Execution incomplete"}
                  </StatusBadge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Progress"
                  value={
                    project.progressPercent + "%"
                  }
                />
                <Metric
                  label="Tasks"
                  value={
                    project.doneTaskCount +
                    "/" +
                    project.taskCount
                  }
                />
                <Metric
                  label="Sprints"
                  value={
                    project.completedSprintCount +
                    "/" +
                    project.sprintCount
                  }
                />
                <Metric
                  label="Releases"
                  value={
                    project.shippedReleaseCount +
                    "/" +
                    project.releaseCount
                  }
                />
              </div>

              <p className="mb-0 mt-4 text-sm text-body">
                Final delivery:{" "}
                <strong>
                  {project.latestSubmission?.status ??
                    "Not started"}
                </strong>
              </p>
            </article>
          ))}
        </div>
      )}

      <ProjectAdminPagination
        basePath={readinessPath}
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="m-0 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mb-0 mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
