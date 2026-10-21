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
import {ProjectSubmissionsPageExport} from "@/components/projects/project-submissions-page-export";
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
  const parsed = parseProjectAdminSubmissionsQuery(searchParams,{superAdmin:basePath.startsWith("/admin/projects")});
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
        <ListToolbar label="Unsubmitted workspaces" viewCount={unsubmitted.total} />
        <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Not submitted · {unsubmitted.total} workspaces</h2>
        <DataTable
          caption="Unsubmitted project workspaces"
          rows={unsubmitted.items}
          getRowKey={row=>row.id}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:row=>row.title},
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
      {summary?<div className="grid min-w-0 grid-cols-2 gap-2 border-y border-border py-3 md:grid-cols-4">
        {([
          ["Active workspaces", summary.activeWorkspaces, basePath+"?status=ACTIVE"],
          ["Pending review", summary.pendingReview, queuePath+"?status=ACTIVE&submissionStatus=SUBMITTED"],
          ["Needs student action", summary.needsStudentAction, queuePath+"?status=ACTIVE&submissionStatus=CHANGES_REQUESTED"],
          ["Reviewed", summary.reviewed, queuePath+"?submissionStatus=APPROVED"],
        ] as const).map(([name, value, href]) => {
          return <Link key={name} href={href}
            className="block min-w-0 bg-surface px-3 py-3 transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            <p className="text-xs font-semibold text-muted-foreground leading-[20px]">{name}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </Link>;
        })}
      </div>:<Banner tone="warning">
        Submission totals are temporarily unavailable. The filtered submissions below are still visible.
      </Banner>}
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
        revisions:Math.max(0,submission.version-1),
        reviewedBy:submission.reviewedBy,
        sourceUrl:safeProjectExternalHref(submission.sourceUrl),
        demoUrl:safeProjectExternalHref(submission.demoUrl),
      }))}/>} />

      {!result.items.length ? (
        <EmptyState title="No matching deliveries" description="No final-delivery versions match these filters."
          action={<Link href={queuePath} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline md:min-h-9">Clear filters</Link>}/>
      ) : (
        <div className="min-w-0 divide-y divide-border border-y border-border">
          {result.items.map((submission) => (
            <article
              key={submission.id}
              className="min-w-0 py-4"
            >
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={
                      basePath +
                      "/" +
                      submission.projectId +
                      "/delivery"
                    }
                    className="inline-flex min-h-11 max-w-full items-center break-words text-base font-semibold text-[var(--lms-heading)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
                  >
                    {submission.projectTitle}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                    Version {submission.version} ·{" "}
                    {formatDate(
                      submission.submittedAt,
                    )}
                  </p>
                </div>
                <StatusBadge
                  tone={tone(submission.status)}
                >
                  {submission.reopenedAt?"Draft (revising)":
                    submission.lockedAt?"Locked":
                    submission.status==="SUBMITTED"?"Under Review":submission.status}
                </StatusBadge>
              </div>
              <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 text-xs text-body md:grid-cols-3">
                <div><dt className="font-semibold">Pending</dt><dd>{
                  submission.status === "SUBMITTED" && submission.submittedAt
                    ? (projectAdminElapsedDays(submission.submittedAt,renderedAt)===null?"—":projectAdminElapsedDays(submission.submittedAt,renderedAt)+" days")
                    : "—"
                }</dd></div>
                <div><dt className="font-semibold">Revisions</dt>
                  <dd>{Math.max(0, submission.version - 1)}</dd></div>
                <div><dt className="font-semibold">Mentor</dt><dd>{submission.mentorMembershipId?"Assigned":"Unassigned"}</dd></div>
                <div><dt className="font-semibold">Reviewed by</dt>
                  <dd>{submission.reviewedBy ?? "—"}</dd></div>
              </dl>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{submission.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {([submission.sourceUrl, submission.demoUrl] as const).map((candidate, i) => {
                  const href = safeProjectExternalHref(candidate);
                  return href ? <a href={href} key={i} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Open link</a> : null;
                })}
                {submission.attachments.map((item, index) => {
                  if (!item || typeof item !== "object") return null;
                  const entry = item as Record<string, unknown>;
                  const href = typeof entry.url === "string" ? safeProjectExternalHref(entry.url) : null;
                  return href ? <a key={"evidence-" + index} href={href} target="_blank"
                    rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
                    Open {entry.kind === "FILE" ? "file" : "link"}
                  </a> : <span key={"evidence-" + index} className="text-muted-foreground">
                    File · {typeof entry.name === "string" ? entry.name : "Evidence"}
                  </span>;
                })}
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                <ProjectAdminSubmissionReview
                  projectId={submission.projectId} submissionId={submission.id}
                  workspaceTitle={submission.projectTitle}
                  status={submission.status} locked={!!submission.lockedAt}
                  projectStatus={submission.projectStatus} allowLock={allowLock} />
                <Link href={basePath+"/"+submission.projectId+
                  "/delivery?from=submissions"+(submission.status==="SUBMITTED"?"&reason=REVIEW":"")}
                  className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Open · Review submission</Link>
                <Link href={basePath+"/reassign-mentor?fromMentorId="+
                  encodeURIComponent(submission.mentorMembershipId??"UNASSIGNED")}
                  className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
                  {submission.mentorMembershipId?"Reassign mentor":"Assign mentor"}
                </Link>
              </div>
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
      </>:null}
    </div>
  );
}
