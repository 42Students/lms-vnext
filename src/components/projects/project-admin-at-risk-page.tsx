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
  listProjectAdminRiskQueue,
} from "@/modules/projects/admin-insights-service";

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export async function ProjectAdminAtRiskPage({
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
    status: one(searchParams.status) as ProjectAdminCollectionQuery["status"],
    page: Number(one(searchParams.page) ?? 1),
    pageSize: Number(
      one(searchParams.pageSize) ?? 25,
    ),
  };
  const result =
    await listProjectAdminRiskQueue(
      context,
      collegeId,
      query,
    );

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="at-risk"
      />
      <PageHeader
        eyebrow={eyebrow}
        title="At-risk projects"
        description="Active workspaces with seven days of persisted inactivity or final delivery waiting for review."
      />
      {!result.blockerSignalSupported ? (
        <section className="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm leading-6 text-body">
          Legacy also flags a workspace when its explicit
          blocker text is set. DB07 vNext does not persist
          that blocker field yet, so this queue does not
          claim that risk dimension is covered.
        </section>
      ) : null}
      <ProjectAdminFilters query={query} />

      {!result.items.length ? (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No at-risk project workspaces match these filters.
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
                      "/summary"
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
                    {" · "}
                    Last persisted activity{" "}
                    {formatDate(
                      project.lastActivityAt,
                    )}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    project.riskReasons.length > 1
                      ? "warning"
                      : "neutral"
                  }
                >
                  {project.riskReasons.length} signal
                  {project.riskReasons.length === 1
                    ? ""
                    : "s"}
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.riskReasons.map((reason) => (
                  <StatusBadge
                    key={reason}
                    tone="warning"
                  >
                    {reason}
                  </StatusBadge>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <ProjectAdminPagination
        basePath={basePath + "/at-risk"}
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
