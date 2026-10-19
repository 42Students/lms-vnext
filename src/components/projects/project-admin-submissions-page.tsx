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
import { Tabs } from "@/components/ui/tabs";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { parseProjectAdminSubmissionsQuery,projectAdminUnsubmittedHref,projectAdminSubmissionHref } from "@/modules/projects/admin-submissions-query-model";
import {ProjectAdminSubmissionReview} from "@/components/projects/project-admin-submission-review";
import {ProjectSubmissionsPageExport} from "@/components/projects/project-submissions-page-export";
import {listProjectAdminUnsubmitted} from "@/modules/projects/admin-unsubmitted-service";
import { StatusBadge } from "@/components/ui/status-badge";
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
  const allowLock = mayRecordCollegeAdminDeliveryLock(context,collegeId,
    context.adminScope?.organizationId ?? context.membership?.organizationId ?? "");
  const parsed = parseProjectAdminSubmissionsQuery(searchParams);
  if (!parsed.success) {
    return <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title="Submissions dashboard"
        description="Final project deliverables across all workspaces." />
      <ErrorState title="Invalid submission filters"
        description="Check the submission view, status, page and rows filters, or clear them to continue."
        action={<Link href={basePath + "/submissions"}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>} />
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
    return <div className="space-y-6">
      <ProjectAdminNav basePath={basePath} active="submissions"/>
      <PageHeader eyebrow={eyebrow} title="Submissions dashboard"
        description="Final project deliverables across all workspaces."/>
      <ErrorState title="Submissions unavailable"
        description="The submissions list could not be loaded. Your filters have not changed."
        action={<Link href={queuePath+(suffix?"?"+suffix:"")}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry loading submissions</Link>}/>
    </div>;
  }

  return (
    <div className="space-y-6">
      <ProjectAdminNav
        basePath={basePath}
        active="submissions"
      />
      <PageHeader
        eyebrow={eyebrow}
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
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry loading workspaces</Link>}/>:null}
      {unsubmitted?<section className="space-y-3 border-b border-border pb-5">
        <ProjectAdminFilters query={query} filterView="NOT_SUBMITTED"/>
        <ListToolbar label="Unsubmitted workspaces" viewCount={unsubmitted.total} />
        <h2 className="font-semibold">Not submitted · {unsubmitted.total} workspaces</h2>
        <DataTable
          caption="Unsubmitted project workspaces"
          rows={unsubmitted.items}
          getRowKey={row=>row.id}
          columns={[
            {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:row=>row.title},
            {key:"status",header:"Status",mobilePriority:"secondary",cell:row=>row.status},
            {key:"progress",header:"Progress",mobilePriority:"secondary",cell:row=>row.progressPercent+"%"},
            {key:"inactive",header:"Inactive",mobilePriority:"secondary",cell:row=>
              (projectAdminElapsedDays(row.updatedAt,renderedAt)===null?"—":projectAdminElapsedDays(row.updatedAt,renderedAt)+" days")},
            {key:"action",header:"Action",mobilePriority:"action",cell:row=>
              <Link href={basePath+"/"+row.id+"/delivery"}
                className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open</Link>},
          ]}
          empty={<p className="text-sm text-muted-foreground">All matching workspaces have a submission.</p>}
        />
        <div className="flex flex-wrap gap-3 text-sm">
          {unsubmitted.page>1?<Link href={projectAdminUnsubmittedHref(queuePath,query,unsubmitted.page-1)}
           className="text-primary-text underline">Previous</Link>:null}
          <span>Page {unsubmitted.page} of {unsubmitted.totalPages}</span>
          {unsubmitted.page<unsubmitted.totalPages?<Link href={projectAdminUnsubmittedHref(queuePath,query,unsubmitted.page+1)}
           className="text-primary-text underline">Next</Link>:null}
        </div>
      </section>:null}
      {view==="ALL" && result ? <>
      {summary?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ["Active workspaces", summary.activeWorkspaces, basePath+"?status=ACTIVE"],
          ["Pending review", summary.pendingReview, queuePath+"?status=ACTIVE&submissionStatus=SUBMITTED"],
          ["Needs student action", summary.needsStudentAction, queuePath+"?status=ACTIVE&submissionStatus=CHANGES_REQUESTED"],
          ["Reviewed", summary.reviewed, queuePath+"?submissionStatus=APPROVED"],
        ] as const).map(([name, value, href]) => {
          return <Link key={name} href={href}
            className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 hover:border-primary">
            <p className="text-xs font-semibold text-muted-foreground">{name}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </Link>;
        })}
      </div>:<Banner tone="warning">
        Submission totals are temporarily unavailable. The filtered submissions below are still visible.
      </Banner>}
      <ProjectAdminFilters
        query={query}
        includeSubmissionStatus
      />
      <ListToolbar label="Project submissions" viewCount={result.total} />
      <ProjectSubmissionsPageExport rows={result.items.map(submission=>({
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
      }))}/>

      {!result.items.length ? (
        <section className="border-b border-border py-6 text-sm text-muted-foreground">
          No final-delivery versions match these filters.
        </section>
      ) : (
        <div className="space-y-3">
          {result.items.map((submission) => (
            <article
              key={submission.id}
              className="border-b border-border py-5 last:border-b-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={
                      basePath +
                      "/" +
                      submission.projectId +
                      "/delivery"
                    }
                    className="text-base font-semibold text-foreground hover:text-primary-text"
                  >
                    {submission.projectTitle}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
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
              <dl className="mt-3 grid gap-2 text-xs text-body sm:grid-cols-3">
                <div><dt className="font-semibold">Pending</dt><dd>{
                  submission.status === "SUBMITTED" && submission.submittedAt
                    ? (projectAdminElapsedDays(submission.submittedAt,renderedAt)===null?"—":projectAdminElapsedDays(submission.submittedAt,renderedAt)+" days")
                    : "—"
                }</dd></div>
                <div><dt className="font-semibold">Revisions</dt>
                  <dd>{Math.max(0, submission.version - 1)}</dd></div>
                <div><dt className="font-semibold">Reviewed by</dt>
                  <dd>{submission.reviewedBy ?? "—"}</dd></div>
              </dl>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">{submission.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {([submission.sourceUrl, submission.demoUrl] as const).map((candidate, i) => {
                  const href = safeProjectExternalHref(candidate);
                  return href ? <a href={href} key={i} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-primary-text hover:underline">Open link</a> : null;
                })}
                {submission.attachments.map((item, index) => {
                  if (!item || typeof item !== "object") return null;
                  const entry = item as Record<string, unknown>;
                  const href = typeof entry.url === "string" ? safeProjectExternalHref(entry.url) : null;
                  return href ? <a key={"evidence-" + index} href={href} target="_blank"
                    rel="noopener noreferrer" className="font-semibold text-primary-text hover:underline">
                    Open {entry.kind === "FILE" ? "file" : "link"}
                  </a> : <span key={"evidence-" + index} className="text-muted-foreground">
                    File · {typeof entry.name === "string" ? entry.name : "Evidence"}
                  </span>;
                })}
              </div>
              <ProjectAdminSubmissionReview
                projectId={submission.projectId} submissionId={submission.id}
                workspaceTitle={submission.projectTitle}
                status={submission.status} locked={!!submission.lockedAt}
                projectStatus={submission.projectStatus} allowLock={allowLock} />
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
                <Link href={basePath+"/"+submission.projectId+
                  "/delivery?from=submissions&reason="+encodeURIComponent(
                    submission.status==="SUBMITTED"?"pending-review":submission.status.toLowerCase())}
                  className="text-primary-text underline">Open · Review submission</Link>
                <Link href={basePath+"/reassign-mentor?fromMentorId="+
                  encodeURIComponent(submission.mentorMembershipId??"UNASSIGNED")}
                  className="text-primary-text underline">
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
