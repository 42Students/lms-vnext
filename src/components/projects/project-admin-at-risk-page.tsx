import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Banner } from "@/components/ui/banner";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { parseProjectAdminRiskQuery } from "@/modules/projects/admin-risk-query-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterChipLink } from "@/components/ui/filter-chip";
import {
  listProjectAdminRiskQueue,
} from "@/modules/projects/admin-insights-service";
import {ProjectAtRiskPageExport} from "./project-at-risk-page-export";
import {formatProjectAdminActivityDateIst as formatDate,safeProjectAdminUtcIso} from "@/modules/projects/project-admin-date-model";



export async function ProjectAdminAtRiskPage({
  collegeId,
  basePath,
  searchParams,
}: {
  collegeId: string;
  basePath: string;
  eyebrow?: string;
  searchParams: Record<
    string,
    string | string[] | undefined
  >;
}) {
  const context = await getCurrentRequestContext();
  const parsed = parseProjectAdminRiskQuery(searchParams);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="At-risk projects"
        description="Workspaces with no recent activity, an active blocker, or a pending review."
        actions={<PageBackLink href={basePath} label="Project workspaces" />} />
      <ProjectAdminNav basePath={basePath} active="at-risk" />
      <ErrorState title="Invalid project filters"
        description="Check the risk, status, sort, search and page filters, or clear them to continue."
        action={<Link href={basePath + "/at-risk"}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>} />
    </div>;
  }
  const query: ProjectAdminCollectionQuery = parsed.data;
  const riskResult = await listProjectAdminRiskQueue(context, collegeId, query)
    .then(value => ({ ok: true as const, value }))
    .catch(() => ({ ok: false as const }));
  if (!riskResult.ok) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="At-risk projects"
        description="Workspaces with no recent activity, an active blocker, or a pending review."
        actions={<PageBackLink href={basePath} label="Project workspaces" />} />
      <ProjectAdminNav basePath={basePath} active="at-risk" />
      <ErrorState title="At-risk workspaces unavailable"
        description="Could not load the risk queue. Your search and filters have not changed."
        action={<Link href={basePath+"/at-risk"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry risk queue</Link>} />
    </div>;
  }
  const result = riskResult.value;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="At-risk projects"
        description="Workspaces with no recent activity, an active blocker, or a pending review."
        actions={<div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
        <PageBackLink href={basePath} label="Project workspaces" />
        <ProjectAtRiskPageExport collegeId={collegeId}
          rows={result.items.map(project=>({
            id:project.id,title:project.title,mentorName:project.mentorName,
            inactiveDays:project.inactiveDays,riskReasons:project.riskReasons,
            blockerReason:project.blockerReason,
            lastActivityAt:safeProjectAdminUtcIso(project.lastActivityAt),
          }))}/>
        </div>}
      />
      <ProjectAdminNav basePath={basePath} active="at-risk" />
      {!result.blockerSignalSupported ? (
        <Banner tone="warning">
          Workspace blocker data is unavailable. Task blockers are still counted.
        </Banner>
      ) : null}
      <nav aria-label="At-risk quick filters" className="flex min-w-0 flex-wrap items-center gap-2">
        {([
          ["Stalled", result.buckets.stalled, "STALLED"],
          ["Active blocker", result.buckets.blocker, "BLOCKER"],
          ["Pending review", result.buckets.review, "REVIEW"],
        ] as const).map(([title, value, key]) =>
          <FilterChipLink key={key} href={basePath + "/at-risk?riskBucket=" + key}
            selected={query.riskBucket === key} tone={value > 0 ? "warning" : "neutral"}>
            {title} <span className="tabular-nums">{value}</span>
          </FilterChipLink>)}
      </nav>
      <p className="text-xs text-muted-foreground">CSV includes only the workspaces on this page.</p>
      <FilterBar title="Filters"><ProjectAdminFilters query={query} includeRiskSort /></FilterBar>
      <ListToolbar label="At-risk workspaces" viewCount={result.total} />

      {!result.items.length ? (
        <EmptyState title="No at-risk projects" description="No at-risk project workspaces match these filters."/>
      ) : (
        <div className="divide-y divide-border">
          {result.items.map((project) => (
            <article
              key={project.id}
              className="py-5"
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
                    className="text-base font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
              {project.blockerReason ? <Banner tone="warning" className="mt-3">
                <strong>Active blocker: </strong>
                <span className="whitespace-pre-wrap break-words">{project.blockerReason}</span>
              </Banner> : null}
              <dl className="mt-3 grid min-w-0 gap-3 text-sm text-body md:grid-cols-3">
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
