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
  const dynamicDescription=result.total>0
    ? result.total+" "+(result.total===1?"workspace needs":"workspaces need")+" attention."
    : "No at-risk projects detected for this college.";

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <PageBackLink href={basePath} label="Project workspaces" />
        <PageHeader title="At-risk projects"
          description={dynamicDescription} />
      </div>
      <ProjectAdminNav basePath={basePath} active="at-risk" />
      {!result.blockerSignalSupported ? (
        <Banner tone="warning">
          Workspace blocker data is unavailable. Task blockers are still counted.
        </Banner>
      ) : null}
      <nav aria-label="At-risk quick filters" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([
          ["Stalled",result.buckets.stalled,"STALLED","◷"],
          ["Active blocker",result.buckets.blocker,"BLOCKER","!"],
          ["Pending review",result.buckets.review,"REVIEW","✓"],
        ] as const).map(([name,value,key,icon])=>{
          const selected=query.riskBucket===key;
          const qs=new URLSearchParams();
          if(query.q)qs.set("q",query.q);
          if(query.status)qs.set("status",query.status);
          if(!selected)qs.set("riskBucket",key);
          const target=basePath+"/at-risk"+(qs.size?"?"+qs.toString():"");
          return <Link key={key} href={target} aria-current={selected?"true":undefined}
            className={"group flex min-h-28 min-w-0 items-center gap-4 rounded-[var(--lms-canvas-radius)] border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+
              (selected?"border-[var(--lms-primary)] bg-primary-subtle ring-1 ring-[var(--lms-primary)]":"border-border bg-surface hover:border-[var(--lms-primary)]")}>
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">{icon}</span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold tabular-nums text-[var(--lms-heading)]">{value}</span>
              <span className="block text-sm font-semibold text-body">{name}</span>
            </span>
            {selected?<span className="ml-auto text-xs text-link">Clear</span>:null}
          </Link>;
        })}
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
      

      {!result.items.length?(
        <EmptyState title="No at-risk projects" description={query.q||query.riskBucket||query.status
          ?"No at-risk workspaces match this filter.":"No at-risk projects detected for this college."}
          action={<Link href={basePath+"/at-risk"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Clear filters</Link>}/>
      ):(
        <div className="min-w-0 overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-border">
          <table className="w-full min-w-[1020px] table-auto border-collapse text-left text-sm">
            <caption className="sr-only">{result.total} {result.total===1?"at-risk workspace":"at-risk workspaces"} in this college</caption>
            <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-3 font-semibold">Workspace</th>
                <th scope="col" className="px-3 py-3 font-semibold">Mentor</th>
                <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                <th scope="col" className="px-3 py-3 font-semibold">Risk</th>
                <th scope="col" className="px-3 py-3 font-semibold">Stalled</th>
                <th scope="col" className="px-3 py-3 font-semibold">Blocker</th>
                <th scope="col" className="px-3 py-3 font-semibold">Last activity</th>
                <th scope="col" className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {result.items.map(project=>{
                const stalled=project.riskReasons.some(reason=>reason.startsWith("No activity in "));
                const severity=project.riskReasons.length>=3?"High risk":
                  project.riskReasons.length===2?"At risk":"Watch";
                return <tr key={project.id} className="align-top hover:bg-muted/50">
                  <td className="px-3 py-3 font-semibold">
                    <Link href={basePath+"/"+project.id+"/summary"} className="text-link underline-offset-2 hover:underline">{project.title}</Link>
                  </td>
                  <td className="px-3 py-3">{project.mentorName||"—"}</td>
                  <td className="px-3 py-3"><StatusBadge tone={project.status==="ACTIVE"?"success":"neutral"}>{project.status==="ACTIVE"?"Active":project.status==="PLANNED"?"Planned":project.status}</StatusBadge></td>
                  <td className="px-3 py-3 space-y-1">
                    <StatusBadge tone={severity==="Watch"?"neutral":"warning"}>{severity}</StatusBadge>
                    <div className="flex max-w-48 flex-wrap gap-1">
                      {project.riskReasons.map(reason=><StatusBadge key={reason} tone="warning">{reason}</StatusBadge>)}
                    </div>
                  </td>
                  <td className="px-3 py-3">{stalled?(project.inactiveDays===0?"Today":project.inactiveDays+"d"):"—"}</td>
                  <td className="max-w-60 break-words px-3 py-3">{project.blockerReason||"—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(project.lastActivityAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <Link href={basePath+"/"+project.id+"/summary?from=at-risk"} className="font-semibold text-link underline">Open</Link>
                      <Link href={basePath+"/reassign-mentor?fromMentorId="+encodeURIComponent(project.mentorMembershipId??"UNASSIGNED")} className="font-semibold text-link underline">{project.mentorMembershipId?"Reassign mentor":"Assign mentor"}</Link>
                      {project.riskReasons.includes("Pending review")?<Link href={basePath+"/"+project.id+"/delivery?from=at-risk&reason=pending-review"} className="font-semibold text-link underline">Review submission</Link>:null}
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
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
