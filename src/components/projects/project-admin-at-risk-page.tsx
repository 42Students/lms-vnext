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
import {ProjectAtRiskPageExport} from "./project-at-risk-page-export";

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
  const bucket = one(searchParams.riskBucket);
  const query: ProjectAdminCollectionQuery = {
    riskBucket: bucket === "STALLED" || bucket === "BLOCKER" || bucket === "REVIEW" ? bucket : undefined,
    riskSort: (["INACTIVE","WORKSPACE","SEVERITY"].includes(one(searchParams.riskSort)??"")
      ? one(searchParams.riskSort) : undefined) as ProjectAdminCollectionQuery["riskSort"],
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
        description="Projects that need attention (stalled, blocked, or waiting for review)."
      />
      {!result.blockerSignalSupported ? (
        <section className="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm leading-6 text-body">
          Workspace blocker data is unavailable. Task blockers are still counted.
        </section>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          ["Stalled", result.buckets.stalled, "STALLED"],
          ["Active blocker", result.buckets.blocker, "BLOCKER"],
          ["Pending review", result.buckets.review, "REVIEW"],
        ] as const).map(([title, value, key]) =>
          <Link key={key} href={basePath + "/at-risk?riskBucket=" + key}
            className={"rounded-xl border bg-surface p-4 hover:border-primary " +
              (query.riskBucket === key ? "border-primary" : "border-border")}>
            <p className="text-sm font-semibold text-body">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </Link>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProjectAtRiskPageExport collegeId={collegeId}
          rows={result.items.map(project=>({
            id:project.id,title:project.title,mentorName:project.mentorName,
            inactiveDays:project.inactiveDays,riskReasons:project.riskReasons,
            blockerReason:project.blockerReason,
            lastActivityAt:project.lastActivityAt.toISOString(),
          }))}/>
        <p className="text-xs text-muted-foreground">CSV includes only the workspaces on this page.</p>
      </div>
      <ProjectAdminFilters query={query} includeRiskSort />

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
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={project.riskReasons.length>1||project.blockerReason?"warning":"neutral"}>
                    {project.riskReasons.length>1||project.blockerReason?"Risk":"Watch"}
                  </StatusBadge>
                  <StatusBadge tone="neutral">
                    {project.riskReasons.length} {project.riskReasons.length===1?"reason":"reasons"}
                  </StatusBadge>
                </div>
              </div>
              {project.blockerReason ? <div className="mt-3 rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">
                <p className="font-semibold">Active blocker</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{project.blockerReason}</p>
              </div> : null}
              <dl className="mt-3 grid gap-3 text-sm text-body sm:grid-cols-3">
                <div><dt className="font-semibold">Severity</dt><dd>
                  {project.riskReasons.length > 1 || project.blockerReason ? "Risk" : "Watch"}
                </dd></div>
                <div><dt className="font-semibold">Inactive</dt><dd>
                  <span aria-label={"Inactive for "+project.inactiveDays+" days"}>
                    {project.inactiveDays} {project.inactiveDays===1?"day":"days"}
                  </span>
                </dd></div>
                <div><dt className="font-semibold">Blocker</dt><dd className="break-words">
                  {project.blockerReason ?? "—"}
                </dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <Link href={basePath + "/" + project.id + "/summary?from=at-risk&reason=" +
                  encodeURIComponent(project.riskReasons.join(", "))}
                  className="text-primary-text hover:underline">Open</Link>
                <Link href={basePath + "/reassign-mentor?fromMentorId=" +
                  encodeURIComponent(project.mentorMembershipId ?? "UNASSIGNED")}
                  className="text-primary-text hover:underline">
                  {project.mentorMembershipId ? "Reassign mentor" : "Assign mentor"}
                </Link>
                {project.riskReasons.includes("Pending review") ?
                  <Link href={basePath + "/" + project.id + "/delivery?from=at-risk&reason=pending-review"}
                    className="text-primary-text hover:underline">Review submission</Link> : null}
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
