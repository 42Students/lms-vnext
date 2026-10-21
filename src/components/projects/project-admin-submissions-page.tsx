import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {mayRecordCollegeAdminDeliveryLock} from "@/modules/projects/admin-submission-lock-policy";
import {
  ProjectAdminFilters,
  ProjectAdminPagination,
  type ProjectAdminCollectionQuery,
} from "@/components/projects/project-admin-collection-controls";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Tabs } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { parseProjectAdminSubmissionsQuery,projectAdminUnsubmittedHref,projectAdminSubmissionHref } from "@/modules/projects/admin-submissions-query-model";
import {ProjectAdminSubmissionReview} from "@/components/projects/project-admin-submission-review";
import {ProjectSubmissionsPageExport,ProjectUnsubmittedPageExport} from "@/components/projects/project-submissions-page-export";
import {listProjectAdminUnsubmitted} from "@/modules/projects/admin-unsubmitted-service";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import {formatProjectAdminActivityDateIst as formatDate,safeProjectAdminUtcIso} from "@/modules/projects/project-admin-date-model";
import {projectAdminElapsedDays} from "@/modules/projects/admin-submission-age-model";
import { DataTable } from "@/components/ui/data-table";
import {
  listProjectAdminSubmissionQueue,
  getProjectAdminSubmissionSummary,
} from "@/modules/projects/admin-insights-service";

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



export async function ProjectAdminSubmissionsPage({
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
  const allowLock = mayRecordCollegeAdminDeliveryLock(context,collegeId,
    context.adminScope?.organizationId ?? context.membership?.organizationId ?? "");
  const parsed = parseProjectAdminSubmissionsQuery(searchParams);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Submissions dashboard"
        description="Final project deliverables across all workspaces."
        actions={<PageBackLink href={basePath} label="Project workspaces" />} />
      <ProjectAdminNav basePath={basePath} active="submissions" />
      <ErrorState title="Invalid submission filters"
        description="Check the submission view, status, page and rows filters, or clear them to continue."
        action={<Link href={basePath + "/submissions"}
          className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link>} />
    </div>;
  }
  const { view, ...safeQuery } = parsed.data;
  const query: ProjectAdminCollectionQuery = safeQuery;
  const sort=query.sort??"SUBMITTED_DESC";
  // An unsubmitted tab must not depend on unrelated final-delivery reads:
  // one optional summary failure cannot hide a separate valid workspace list.
  const all = view==="ALL"?await Promise.allSettled([
    listProjectAdminSubmissionQueue(context, collegeId, query),
    getProjectAdminSubmissionSummary(context, collegeId),
  ]):null;
  const submissionsRead=all?.[0];
  const summaryRead=all?.[1];
  const result=submissionsRead?.status==="fulfilled"?submissionsRead.value:null;
  const summary=summaryRead?.status==="fulfilled"?summaryRead.value:null;
  const queuePath=basePath+"/submissions";
  const renderedAt=new Date();
  const unsubmittedResult=view==="NOT_SUBMITTED"
    ? await listProjectAdminUnsubmitted(context,collegeId,{
        q:query.q,status:query.status,page:query.page,pageSize:query.pageSize,
      }).then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}))
    : null;
  const unsubmitted=unsubmittedResult?.ok?unsubmittedResult.value:null;
  if(view==="ALL"&&!result){
    const params=new URLSearchParams();
    if(query.q)params.set("q",query.q);
    if(query.status)params.set("status",query.status);
    if(query.submissionStatus)params.set("submissionStatus",query.submissionStatus);
    if(query.page&&query.page>1)params.set("page",String(query.page));
    if(query.pageSize)params.set("pageSize",String(query.pageSize));
    const suffix=params.toString();
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Submissions dashboard"
        description="Final project deliverables across all workspaces."
        actions={<PageBackLink href={basePath} label="Project workspaces" />}/>
      <ProjectAdminNav basePath={basePath} active="submissions"/>
      <ErrorState title="Submissions unavailable"
        description="The submissions list could not be loaded. Your filters have not changed."
        action={<Link href={queuePath+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Retry loading submissions</Link>}/>
    </div>;
  }

  return (
    <div className="min-w-0 space-y-4">
      <PageBackLink href={basePath} label="Project workspaces" />
      <PageHeader
        title="Submissions dashboard"
        description="Final project deliverables across all workspaces."
        needsDoingLabel="Review status:"
        selectedNeedKey={query.submissionStatus}
        needsDoingItems={[
          {key:"UNDER_REVIEW",label:"Under Review",href:projectAdminSubmissionHref(queuePath,query,"UNDER_REVIEW"),tone:"warning"},
          {key:"LOCKED",label:"Locked",href:projectAdminSubmissionHref(queuePath,query,"LOCKED"),tone:"neutral"},
          {key:"DRAFT_REVISING",label:"Draft (revising)",href:projectAdminSubmissionHref(queuePath,query,"DRAFT_REVISING"),tone:"info"},
        ]}
      />
      <ProjectAdminNav basePath={basePath} active="submissions" />
      <Tabs
        ariaLabel="Submission categories"
        renderPanel={false}
        value={view}
        items={[
          {value:"ALL",label:"All submissions",href:projectAdminSubmissionHref(queuePath,query),count:result?.total},
          {value:"NOT_SUBMITTED",label:"Not submitted",href:projectAdminUnsubmittedHref(queuePath,query),count:unsubmitted?.total},
        ]}
      />
      {view==="NOT_SUBMITTED"&&!unsubmitted?<ErrorState
        title="Unsubmitted workspaces unavailable"
        description="The unsubmitted workspace list could not be loaded. Your filters have not changed."
        action={<Link href={projectAdminUnsubmittedHref(queuePath,query,query.page)}
          className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Retry loading workspaces</Link>}/>:null}
      {unsubmitted?<section className="min-w-0 space-y-3 border-b border-border pb-4">
        <FilterBar title="Filters"><ProjectAdminFilters query={query} filterView="NOT_SUBMITTED"/></FilterBar>
        <ListToolbar label="Unsubmitted workspaces" viewCount={unsubmitted.total}
          exportAction={<ProjectSubmissionsPageExport view="NOT_SUBMITTED" rows={unsubmitted.items.map(item=>({
            workspace:item.title,version:0,status:item.status,submissionType:"",pendingDays:item.progressPercent,
            submittedAt:null,revisions:0,reviewedBy:null,sourceUrl:null,demoUrl:null,
          }))}/>} />
        <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Not submitted · {unsubmitted.total} workspaces</h2>
        <DataTable
          caption="Unsubmitted project workspaces"
          rows={unsubmitted.items}
          getRowKey={row=>row.id}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:row=>row.title},
            {key:"mentor",header:"Mentor",mobilePriority:"secondary",
              cell:row=>row.mentorName??"—"},
            {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="ACTIVE"?"success":row.status==="PLANNED"?"info":"neutral"}>{row.status}</StatusBadge>},
            {key:"progress",header:"Progress",mobilePriority:"secondary",cell:row=>row.progressPercent+"%"},
            {key:"inactive",header:"Inactive",mobilePriority:"secondary",cell:row=>
              (projectAdminElapsedDays(row.updatedAt,renderedAt)===null?"—":projectAdminElapsedDays(row.updatedAt,renderedAt)+" days")},
            {key:"action",header:"Action",mobilePriority:"action",cell:row=>
              <Link href={basePath+"/"+row.id+"/delivery"}
                className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Open</Link>},
          ]}
          empty={<EmptyState title="No pending submissions" description="All matching workspaces have a submission." />}
        />
        <Pagination page={unsubmitted.page} pageCount={unsubmitted.totalPages}
          hrefForPage={page=>projectAdminUnsubmittedHref(queuePath,query,page)}
          label="Unsubmitted workspace pages"/>
      </section>:null}
      {view==="ALL" && result ? <>
      {summary?<div role="group" aria-label="Submission quick filters"
        className="grid min-w-0 grid-cols-1 gap-2 border-y border-border py-3 sm:grid-cols-3">
        {([
          ["Pending review",summary.pendingReview,"UNDER_REVIEW"],
          ["Needs student action",summary.needsStudentAction,"CHANGES_REQUESTED"],
          ["Reviewed",summary.reviewed,"APPROVED"],
        ] as const).map(([name,count,status])=>{
          const pressed=query.submissionStatus===status;
          return <Link key={name} role="button" aria-pressed={pressed}
            href={projectAdminSubmissionHref(queuePath,query,pressed?undefined:status)}
            className={"block min-h-11 min-w-0 rounded-[var(--lms-control-radius)] border p-3 "+
              (pressed?"border-[var(--lms-primary)] bg-primary-subtle":"border-border bg-surface hover:bg-primary-subtle")}>
            <span className="block text-xs font-semibold text-body">{name}</span>
            <span className="mt-2 block text-2xl font-semibold tabular-nums text-foreground">{count}</span>
            {pressed?<span className="mt-1 block text-xs font-semibold text-link">Selected · clear filter</span>:null}
          </Link>;
        })}
      </div>:<Banner tone="warning">
        Submission totals are temporarily unavailable. The filtered submissions below are still visible.
      </Banner>}
      {summary?<div className="grid min-w-0 grid-cols-2 gap-2 border-b border-border pb-3">
        <div className="min-w-0 p-2">
          <span className="text-xs text-body">Active workspaces</span>
          <p className="text-lg font-semibold tabular-nums">{summary.activeWorkspaces}</p>
        </div>
        <div className="min-w-0 p-2">
          <span className="text-xs text-body">Visible submissions</span>
          <p className="text-lg font-semibold tabular-nums">{result.total}</p>
        </div>
      </div>:null}
      <FilterBar title="Filters"><ProjectAdminFilters
        query={query}
        includeSubmissionStatus
      /></FilterBar>
      <ListToolbar label="Project submissions" viewCount={result.total}
        exportAction={<ProjectSubmissionsPageExport rows={result.items.map(submission=>({
        workspace:submission.projectTitle,
        version:submission.version,
        status:submission.lockedAt?"Locked":submission.reopenedAt?"Draft (revising)":submission.status,
        submissionType:submission.attachments.some(entry=>entry && typeof entry==="object" && "kind" in entry && entry.kind==="FILE")?"File upload":
          submission.sourceUrl||submission.demoUrl?"Link":"Text",
        pendingDays:submission.status==="SUBMITTED"&&submission.submittedAt?
          projectAdminElapsedDays(submission.submittedAt,renderedAt):null,
        submittedAt:submission.submittedAt?safeProjectAdminUtcIso(submission.submittedAt):null,
        revisions:submission.revisionCount,
        submittedBy:submission.submittedBy,
        reviewedBy:submission.reviewedBy,
        reviewedAt:submission.reviewedAt?safeProjectAdminUtcIso(submission.reviewedAt):null,
        reviewedByType:submission.reviewedByType,
        sourceUrl:safeProjectExternalHref(submission.sourceUrl),
        demoUrl:safeProjectExternalHref(submission.demoUrl),
      }))}/>} />

      <div className="min-w-0 space-y-3">
        <p className="text-xs text-body">
          Showing current and historical final-delivery versions. Historical versions
          are read only; review actions target only the latest active version.
        </p>
        <DataTable caption="Project submission versions" rows={result.items}
          getRowKey={submission=>submission.id}
          sortHref={(column)=>{
            const next=column==="pending"?"PENDING_DESC":
              column==="revisions"?"REVISIONS_DESC":"SUBMITTED_DESC";
            const params=new URLSearchParams();
            if(query.q)params.set("q",query.q);
            if(query.status)params.set("status",query.status);
            if(query.submissionStatus)params.set("submissionStatus",query.submissionStatus);
            if(query.pageSize)params.set("pageSize",String(query.pageSize));
            params.set("sort",next);
            return queuePath+"?"+params.toString();
          }}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",
              cell:row=><Link href={basePath+"/"+row.projectId+"/delivery"}
                className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
                {row.projectTitle}</Link>},
            {key:"kind",header:"Submission type",mobilePriority:"secondary",
              cell:row=>row.attachments.some(item=>item&&typeof item==="object"&&
                "kind" in item&&item.kind==="FILE")?"File upload":
                row.sourceUrl||row.demoUrl?"Link":"Text"},
            {key:"reviewStatus",header:"Review status",mobilePriority:"secondary",
              cell:row=><StatusBadge tone={tone(row.status)}>
                {row.lockedAt?"Locked":row.reopenedAt?"Draft (revising)":
                  row.status==="SUBMITTED"?"Under Review":row.status}
              </StatusBadge>},
            {key:"pending",header:"Pending",sortable:true,
              sortDirection:sort==="PENDING_DESC"?"descending":"none",
              mobilePriority:"secondary",cell:row=>row.status==="SUBMITTED"&&row.submittedAt
                ?(projectAdminElapsedDays(row.submittedAt,renderedAt)??0)+" days":"—"},
            {key:"submitted",header:"Submitted",sortable:true,
              sortDirection:sort==="SUBMITTED_DESC"?"descending":"none",
              mobilePriority:"secondary",cell:row=><div className="text-xs">
                <p>{formatDate(row.submittedAt)}</p>
                <p className="mt-1">{row.submittedBy??"—"}</p>
              </div>},
            {key:"revisions",header:"Revisions",sortable:true,
              sortDirection:sort==="REVISIONS_DESC"?"descending":"none",
              mobilePriority:"secondary",cell:row=>row.revisionCount??"—"},
            {key:"reviewedBy",header:"Reviewed by",mobilePriority:"secondary",
              cell:row=>row.reviewedBy?<div className="space-y-1 text-xs">
                <p>{row.reviewedBy}</p>
                <p>{formatDate(row.reviewedAt)}</p>
                <StatusBadge tone="warning">{row.reviewedByType??"Reviewer"}</StatusBadge>
              </div>:"—"},
            {key:"evidence",header:"Files / Links",mobilePriority:"secondary",
              cell:row=><div className="flex min-w-0 flex-col gap-1">
                {([row.sourceUrl,row.demoUrl] as const).map((value,index)=>{
                  if(!value)return null;
                  const href=safeProjectExternalHref(value);
                  return href?<a key={index} href={href} target="_blank"
                    rel="noopener noreferrer" className="text-link underline">Open link</a>:
                    <span key={index} role="status" className="text-xs text-error">
                      Could not resolve this submission&apos;s file.</span>;
                })}
                {row.attachments.map((item,index)=>{
                  if(!item||typeof item!=="object")return null;
                  const entry=item as Record<string,unknown>;
                  const href=typeof entry.url==="string"?safeProjectExternalHref(entry.url):null;
                  return href?<a key={index} href={href} target="_blank" rel="noopener noreferrer"
                    className="text-link underline">Open {entry.kind==="FILE"?"file":"link"}</a>:
                    <span key={index} role="status" className="text-xs text-error">
                      Could not resolve this submission&apos;s file.</span>;
                })}
              </div>},
            {key:"status",header:"Status",mobilePriority:"secondary",
              cell:row=>row.isCurrentVersion?"Current":("Historical · v"+row.version)},
            {key:"actions",header:"Actions",mobilePriority:"action",
              className:"md:sticky md:right-0 md:z-10 md:bg-surface",
              cell:row=><div className="flex min-w-0 flex-col gap-1">
                {row.isCurrentVersion?<ProjectAdminSubmissionReview
                  projectId={row.projectId} submissionId={row.id}
                  workspaceTitle={row.projectTitle} status={row.status}
                  locked={!!row.lockedAt} projectStatus={row.projectStatus}
                  allowLock={allowLock}/>:null}
                <Link href={basePath+"/"+row.projectId+"/delivery?from=submissions"}
                  className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
                  Open · Review submission</Link>
              </div>},
          ]}
          empty={<EmptyState title="No matching deliveries"
            description="No final-delivery versions match these filters."
            action={<Link href={queuePath} className="text-link underline">Clear filters</Link>}/>}
        />
      </div>

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
