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
import {ProjectsServiceError} from "@/modules/projects/errors";
import {formatProjectAdminActivityDateIst as formatDate,safeProjectAdminUtcIso} from "@/modules/projects/project-admin-date-model";
import {FilterBar} from "@/components/ui/filter-bar";
import {DataTable} from "@/components/ui/data-table";

function RiskActionIcon({type}:{type:"open"|"reassign"|"review"}){
 const paths={
  open:"M7 17 17 7M9 7h8v8M5 5h7M5 5v14h14v-7",
  reassign:"M4 21h4l11-11-4-4L4 17v4zM13 8l4 4",
  review:"M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5",
 };
 return <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 inline-block size-4 shrink-0"
   fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
   <path d={paths[type]}/>
 </svg>;
}

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
  const { page, pageSize, riskBucket, riskSort, q, status } = parsed.data;
  const query: ProjectAdminCollectionQuery = {
    page,
    pageSize,
    ...(riskBucket !== undefined ? { riskBucket } : {}),
    ...(riskSort !== undefined ? { riskSort } : {}),
    ...(q !== undefined ? { q } : {}),
    ...(status !== undefined ? { status } : {}),
  };
  const riskResult = await listProjectAdminRiskQueue(context, collegeId, query)
    .then(value => ({ ok: true as const, value }))
    .catch(error => ({ ok: false as const, error }));
  if (!riskResult.ok) {
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
  const dynamicDescription=result.candidatesTotal>0
    ? result.candidatesTotal+" workspace"+(result.candidatesTotal===1?"":"s")+
      " need attention (stalled, blocked, or waiting for review). Reason counts cover the whole college."
    : "Workspaces with activity, blocker, or pending-review signals.";
  const workspaceHref=(project:{id:string;riskReasons:string[]})=>basePath+"/"+
    encodeURIComponent(project.id)+"/summary?from=at-risk&reason="+
    encodeURIComponent(project.riskReasons[0]??"Project needs attention");
  const bucketIcon=(name:string)=>name==="STALLED"?"◷":name==="BLOCKER"?"⚠":"▤";

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
      <nav aria-label="At-risk quick filters" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {([
          ["Stalled", result.buckets.stalled, "STALLED"],
          ["Active blocker", result.buckets.blocker, "BLOCKER"],
          ["Pending review", result.buckets.review, "REVIEW"],
        ] as const).map(([title, value, key]) =>
          <Link key={key} href={riskHref(basePath,query,query.riskBucket===key?null:key)}
            aria-current={query.riskBucket===key?"true":undefined}
            className={"flex min-h-24 min-w-0 items-center gap-4 rounded-[var(--lms-canvas-radius)] border p-4 transition-colors hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] "+
              (query.riskBucket===key?"border-primary bg-primary-subtle":"border-[var(--lms-canvas-border)] bg-surface")}>
            <span aria-hidden="true" className="text-2xl text-primary-text">{bucketIcon(key)}</span>
            <span className="min-w-0"><span className="block text-xs text-body">{title}</span>
              <span className="mt-1 block text-2xl font-semibold tabular-nums text-foreground">{value}</span>
            </span>
            <span className="sr-only">{query.riskBucket===key?"Clear this risk filter":"Filter by this risk"}</span>
          </Link>)}
      </nav>
      {query.riskBucket?<div className="flex items-center gap-2 text-sm text-body" role="status">
        Filtering by {query.riskBucket==="STALLED"?"Stalled":query.riskBucket==="BLOCKER"?"Active blocker":"Pending review"}
        <Link href={riskHref(basePath,query,null)} className="font-semibold text-link underline"
          aria-label="Clear selected risk bucket filter">Clear ×</Link>
      </div>:null}
      <FilterBar title="Filters"><ProjectAdminFilters query={query} includeRiskSort
        searchPlaceholder="Search workspace title or ID" /></FilterBar>
      <p className="text-xs text-body" role="status">
        Risk buckets count the current search and status filters, independent
        of the selected quick filter. Completed workspaces appear only for
        an unresolved blocker or pending review.
      </p>
      <ListToolbar label="At-risk workspaces" viewCount={result.total}
        exportAction={<ProjectAtRiskPageExport collegeId={collegeId}
          rows={result.items.map(project=>({
            id:project.id,title:project.title,status:project.displayStatus,
            severity:project.riskSeverity,mentorName:project.mentorName,
            inactiveDays:project.inactiveDays,riskReasons:project.riskReasons,
            blockerReason:project.blockerReason,
            lastActivityAt:safeProjectAdminUtcIso(project.lastActivityAt),
          }))}/>} />
      

      <DataTable caption="At-risk project workspaces" rows={result.items}
        mobileMode="scroll"
        sortHref={(column,next)=>riskHref(basePath,{
          ...query,riskSort:column==="workspace"
            ?next==="descending"?"WORKSPACE_DESC":"WORKSPACE"
            :next==="descending"?"INACTIVE":"INACTIVE_DESC",
        },query.riskBucket??null)}
        getRowKey={project=>project.id}
        columns={[
          {key:"workspace",header:"Workspace",mobilePriority:"primary",sortable:true,
           sortDirection:query.riskSort==="WORKSPACE"?"ascending":
             query.riskSort==="WORKSPACE_DESC"?"descending":"none",
           cell:project=><Link href={workspaceHref(project)}
             className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
             {project.title}</Link>},
          {key:"mentor",header:"Mentor",mobilePriority:"secondary",
           cell:project=>project.mentorName?.trim()||"—"},
          {key:"status",header:"Status",mobilePriority:"secondary",
           cell:project=><StatusBadge tone={project.displayStatus==="ACTIVE"||project.displayStatus==="COMPLETED"?"success":
             project.displayStatus==="BLOCKED"?"warning":"neutral"}>
             {project.displayStatus.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,letter=>letter.toUpperCase())}</StatusBadge>},
          {key:"severity",header:"Severity",mobilePriority:"secondary",
           cell:project=><StatusBadge
             tone={project.riskSeverity==="HIGH_RISK"?"error":
               project.riskSeverity==="AT_RISK"?"warning":"neutral"}>
             {project.riskReasons.length+" signal"+(project.riskReasons.length===1?"":"s")}</StatusBadge>},
          {key:"reasons",header:"Risk reasons",mobilePriority:"secondary",
           cell:project=><div className="flex flex-wrap gap-1">
             {project.riskReasons.map(reason=><StatusBadge key={reason} tone={project.riskSeverity==="HIGH_RISK"?"error":
               project.riskSeverity==="AT_RISK"?"warning":"neutral"}>{reason}</StatusBadge>)}
             {!project.riskReasons.length?<span>—</span>:null}
           </div>},
          {key:"inactive",header:"Inactive",mobilePriority:"secondary",sortable:true,
           sortDirection:query.riskSort==="INACTIVE"?"descending":
             query.riskSort==="INACTIVE_DESC"?"ascending":"none",
           cell:project=><span title={"Last activity "+formatDate(project.lastActivityAt)}>
             {!project.riskReasons.includes("Stalled")?"—":project.inactiveDays===0?"Today":project.inactiveDays+"d"}</span>},
          {key:"blocker",header:"Blocker",mobilePriority:"secondary",
           cell:project=><span className="whitespace-pre-wrap break-words">
             {project.blockerReason||"—"}</span>},
          {key:"actions",header:"Actions",mobilePriority:"action",
           cell:project=><div className="flex flex-col items-start gap-1">
             <Link href={workspaceHref(project)}
              className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
               <RiskActionIcon type="open"/>Open</Link>
             <Link href={basePath+"/reassign-mentor?fromMentorId="+
               encodeURIComponent(project.mentorMembershipId??"UNASSIGNED")}
               className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
               <RiskActionIcon type="reassign"/>
               {project.mentorMembershipId?"Reassign mentor":"Assign mentor"}</Link>
             {project.riskReasons.includes("Pending review")?
               <Link href={basePath+"/submissions?tab=submitted&projectId="+encodeURIComponent(project.id)}
                 className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
                 <RiskActionIcon type="review"/>Review submission</Link>:null}
           </div>},
        ]}
        empty={<EmptyState title={result.total>0?"No workspaces on this page":"No at-risk projects"}
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
