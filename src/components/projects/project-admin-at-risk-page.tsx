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
import {DataTable} from "@/components/ui/data-table";
import {ProjectsServiceError} from "@/modules/projects/errors";
function riskHref(basePath:string,query:ProjectAdminCollectionQuery,bucket:string|null){
 const params=new URLSearchParams();
 if(query.q)params.set("q",query.q);
 if(query.status)params.set("status",query.status);
 if(query.riskSort)params.set("riskSort",query.riskSort);
 if(query.pageSize)params.set("pageSize",String(query.pageSize));
 if(bucket)params.set("riskBucket",bucket);
 const qs=params.toString();
 return basePath+"/at-risk"+(qs?"?"+qs:"");
}




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
      <ErrorState title={riskResult.error instanceof ProjectsServiceError&&
       riskResult.error.code==="PROJECT_ACCESS_DENIED"?"Access denied":"Report could not be loaded"}
        description={riskResult.error instanceof ProjectsServiceError&&
         riskResult.error.code==="PROJECT_ACCESS_DENIED"?
           "You do not have permission to view this college's project risk report.":
           "Failed to load project workspaces. Your search and filters have not changed."}
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
          ["Stalled", result.buckets.stalled, "STALLED"],
          ["Active blocker", result.buckets.blocker, "BLOCKER"],
          ["Pending review", result.buckets.review, "REVIEW"],
        ] as const).map(([title, value, key]) =>
          <FilterChipLink key={key} href={riskHref(basePath,query,query.riskBucket===key?null:key)}
            selected={query.riskBucket === key} tone={value > 0 ? "warning" : "neutral"}>
            {title} <span className="tabular-nums">{value}</span>
          </FilterChipLink>)}
      </nav>
      <FilterBar title="Filters"><ProjectAdminFilters query={query} includeRiskSort /></FilterBar>
      <ListToolbar label="At-risk workspaces" viewCount={result.total}
        exportAction={<ProjectAtRiskPageExport collegeId={collegeId}
          rows={result.items.map(project=>({
            id:project.id,title:project.title,status:project.status,
            severity:project.riskSeverity,mentorName:project.mentorName,
            inactiveDays:project.inactiveDays,riskReasons:project.riskReasons,
            blockerReason:project.blockerReason,
            lastActivityAt:safeProjectAdminUtcIso(project.lastActivityAt),
          }))}/>} />
      

      <DataTable caption="At-risk project workspaces" rows={result.items}
        getRowKey={project=>project.id}
        columns={[
          {key:"workspace",header:"Workspace",mobilePriority:"primary",
           cell:project=><Link href={basePath+"/"+project.id+"/summary?from=at-risk"}
             className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
             {project.title}</Link>},
          {key:"mentor",header:"Mentor",mobilePriority:"secondary",
           cell:project=>project.mentorName??"No primary mentor"},
          {key:"status",header:"Status",mobilePriority:"secondary",
           cell:project=><StatusBadge tone={project.status==="ACTIVE"?"success":"neutral"}>
             {project.status}</StatusBadge>},
          {key:"severity",header:"Severity",mobilePriority:"secondary",
           cell:project=><StatusBadge
             tone={project.riskSeverity==="HIGH_RISK"?"error":
               project.riskSeverity==="AT_RISK"?"warning":"neutral"}>
             {project.riskSeverity==="HIGH_RISK"?"High risk":
               project.riskSeverity==="AT_RISK"?"At risk":"Watch"}</StatusBadge>},
          {key:"reasons",header:"Risk reasons",mobilePriority:"secondary",
           cell:project=><div className="flex flex-wrap gap-1">
             {project.riskReasons.map(reason=><StatusBadge key={reason} tone="warning">{reason}</StatusBadge>)}
             {!project.riskReasons.length?<span>—</span>:null}
           </div>},
          {key:"inactive",header:"Inactive",mobilePriority:"secondary",
           cell:project=><span title={"Last activity "+formatDate(project.lastActivityAt)}>
             {project.inactiveDays} {project.inactiveDays===1?"day":"days"}</span>},
          {key:"blocker",header:"Blocker",mobilePriority:"secondary",
           cell:project=><span className="whitespace-pre-wrap break-words">
             {project.blockerReason||"—"}</span>},
          {key:"actions",header:"Actions",mobilePriority:"action",
           cell:project=><div className="flex flex-col items-start gap-1">
             <Link href={basePath+"/"+project.id+"/summary?from=at-risk"}
              className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Open</Link>
             <Link href={basePath+"/reassign-mentor?fromMentorId="+
               encodeURIComponent(project.mentorMembershipId??"UNASSIGNED")}
               className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
               {project.mentorMembershipId?"Reassign mentor":"Assign mentor"}</Link>
             {project.riskReasons.includes("Pending review")?
               <Link href={basePath+"/"+project.id+"/delivery?from=at-risk&reason=REVIEW"}
                 className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
                 Review submission</Link>:null}
           </div>},
        ]}
        empty={<EmptyState title="No at-risk projects"
          description={query.q||query.status||query.riskBucket?
            "No at-risk workspaces match this filter.":
            "No at-risk projects detected for this college."}
          action={<Link href={riskHref(basePath,query,null)}
            className="text-link underline">Clear risk filter</Link>}/>}
      />

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
