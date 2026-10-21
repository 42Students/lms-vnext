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
import {AuthorizationError} from "@/modules/permissions/policy";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {formatProjectAdminActivityDateIst as formatDate,safeProjectAdminUtcIso} from "@/modules/projects/project-admin-date-model";
import {FilterBar} from "@/components/ui/filter-bar";



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
    return <div className="min-w-0 space-y-4">
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
    .catch(error => ({ ok: false as const, error }));
  if (!riskResult.ok) {
    const denied=riskResult.error instanceof AuthorizationError ||
      (riskResult.error instanceof ProjectsServiceError && riskResult.error.code==="PROJECT_ACCESS_DENIED");
    return <div className="min-w-0 space-y-4">
      <PageHeader title="At-risk projects"
        description="Workspaces with no recent activity, an active blocker, or a pending review."
        actions={<PageBackLink href={basePath} label="Project workspaces" />} />
      <ProjectAdminNav basePath={basePath} active="at-risk" />
      <ErrorState title={denied?"At-risk workspaces access denied":"Report could not be loaded"}
        description={denied?"Your current college membership does not authorize this report.": "Failed to load project workspaces. Your search and filters have not changed."}
        action={<Link href={basePath+"/at-risk"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry risk queue</Link>} />
    </div>;
  }
  const result = riskResult.value;

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Project workspaces" />
        <PageHeader title="At-risk projects"
          description="Workspaces with no recent activity, an active blocker, or a pending review." />
      </div>
      <ProjectAdminNav basePath={basePath} active="at-risk" />
      {!result.blockerSignalSupported ? (
        <Banner tone="warning">
          Workspace blocker data is unavailable. Task blockers are still counted.
        </Banner>
      ) : null}
      <nav aria-label="At-risk quick filters" className="flex min-w-0 flex-wrap gap-2">
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
      <FilterBar title="Filters"><ProjectAdminFilters query={query} includeRiskSort /></FilterBar>
      <ListToolbar label="At-risk workspaces" viewCount={result.total}
        exportAction={<ProjectAtRiskPageExport collegeId={collegeId}
          rows={result.items.map(project=>({
            id:project.id,title:project.title,mentorName:project.mentorName,
            inactiveDays:project.inactiveDays,riskReasons:project.riskReasons,
            blockerReason:project.blockerReason,
            lastActivityAt:safeProjectAdminUtcIso(project.lastActivityAt),
          }))}/>} />
      

      {!result.items.length ? (
        <EmptyState title="No at-risk projects" description={query.q||query.riskBucket||query.status
         ? "No at-risk workspaces match this filter."
         : "No at-risk projects detected for this college."}
          action={<Link href={basePath+"/at-risk"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>}/>
      ) : (
        <div className="min-w-0 divide-y divide-border border-y border-border">
          {result.items.map((project) => (
            <article
              key={project.id}
              className="min-w-0 py-[var(--lms-space-4)]"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={
                      basePath +
                      "/" +
                      project.id +
                      "/summary"
                    }
                    className="inline-flex min-h-11 max-w-full items-center break-words text-base font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
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
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <StatusBadge tone={project.riskReasons.length>=2?"warning":"neutral"}>
                    {project.riskReasons.length>=3?"High risk":project.riskReasons.length===2?"At risk":"Watch"}
                  </StatusBadge>
                </div>
              </div>
              {project.blockerReason ? <Banner tone="warning" className="mt-3">
                <strong>Active blocker: </strong>
                <span className="whitespace-pre-wrap break-words">{project.blockerReason}</span>
              </Banner> : null}
              <dl className="mt-3 text-sm text-body">
                <div className="flex min-w-0 flex-wrap items-baseline gap-2"><dt className="font-semibold">Inactive</dt><dd>
                  <span aria-label={"Inactive for "+project.inactiveDays+" days"}>
                    {project.inactiveDays} {project.inactiveDays===1?"day":"days"}
                  </span>
                </dd></div>
              </dl>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                <Link href={basePath + "/" + project.id + "/summary?from=at-risk&reason=" +
                  encodeURIComponent(project.riskReasons.join(", "))}
                  className="inline-flex min-h-11 items-center text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Open</Link>
                <Link href={basePath + "/reassign-mentor?fromMentorId=" +
                  encodeURIComponent(project.mentorMembershipId ?? "UNASSIGNED")}
                  className="inline-flex min-h-11 items-center text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                  {project.mentorMembershipId ? "Reassign mentor" : "Assign mentor"}
                </Link>
                {project.riskReasons.includes("Pending review") ?
                  <Link href={basePath + "/" + project.id + "/delivery?from=at-risk&reason=pending-review"}
                    className="inline-flex min-h-11 items-center text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Review submission</Link> : null}
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

      <p className="text-xs text-muted-foreground leading-[20px]">CSV includes only the workspaces on this page.</p>
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
