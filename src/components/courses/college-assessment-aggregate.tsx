import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";
import { collegeStatusLabel } from "@/modules/courses/college-course-tabs-copy";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FacultyItemActions } from "./faculty-item-actions";
import { AdminQuizResultsActions } from "./admin-learning-structure-actions";
import { CollegeAssignmentReview } from "./college-assignment-review";
import {CollegeAssignmentActions} from "./college-assignment-actions";
import { CollegeAssessmentCourseSectionFilters, type AssessmentDirectoryCourse, type AssessmentDirectorySection } from "./college-assessment-course-section-filters";
import {SuperAdminAssignmentSubmissionsDialog} from "./superadmin-assignment-submissions-dialog";
import {SuperAdminQuizSubmissionsDialog} from "./superadmin-quiz-submissions-dialog";
import {CollegeQuizActions} from "./college-quiz-actions";
import {CollegeQuizAttempts} from "./college-quiz-attempts";
import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import {collegeAssessmentExportHref} from "@/modules/courses/college-assessment-export-model";
import {
  collegeAssessmentHref,
  type CollegeAssessmentAggregateItem,
  type CollegeAssessmentKind,
  type CollegeAssessmentListQuery,
} from "@/modules/courses/college-assessment-aggregate-model";

type Data = {
  kind: CollegeAssessmentKind;
  query: CollegeAssessmentListQuery;
  items: CollegeAssessmentAggregateItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  reviewDeliveries: {offeringId:string;deliveryId:string;sectionName:string;sectionCode:string}[];
  directoryCourses: AssessmentDirectoryCourse[];
  directorySections: AssessmentDirectorySection[];
};

function formatDue(value: Date | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

function QuizListActions({item}:{item:CollegeAssessmentAggregateItem}){
 if(item.status==="ARCHIVED")return null;
 const actions=item.status==="DRAFT"?["PUBLISH"] as const:
  item.status==="PUBLISHED"?["CLOSE"] as const:[] as const;
 return <div className="min-w-0 space-y-2">
  <FacultyItemActions transitionUrl={"/api/courses/quizzes/"+encodeURIComponent(item.id)+"/transition"}
   actions={actions}/>
  {item.resultsReleaseReady?
   <AdminQuizResultsActions quizId={item.id}
    status={item.status==="CLOSED"?"CLOSED":"PUBLISHED"}
    deadlineReached={item.status==="PUBLISHED"}
    resultsPublished={Boolean(item.resultsPublished)}/>:
   item.status==="PUBLISHED"?
   <p className="text-xs text-muted-foreground" title="Results can be released after the quiz deadline">
    Results can be released after the quiz deadline.
   </p>:null}
 </div>;
}

export function CollegeAssessmentAggregate({ data, leading }: { data: Data; leading?: ReactNode }) {
  const isAssignment = data.kind === "ASSIGNMENT";
  const assignmentFilesEnabled=isAssignment&&assignmentFilesRuntimeEnabled();
  const name = isAssignment ? "Assignments" : "Quizzes";

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        eyebrow=""
        title={name}
        actions={<div className="flex flex-wrap items-center gap-2">
          {isAssignment ? leading : null}
          {data.items.length ? <Link prefetch={false} download
            href={collegeAssessmentExportHref(data.kind,data.query,"PAGE")}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text md:min-h-9">
            <span aria-hidden="true">↓</span>Export CSV (page)
          </Link> : <Button variant="secondary" type="button" disabled>Export CSV (page)</Button>}
          <Link prefetch={false} download href={collegeAssessmentExportHref(data.kind,data.query)}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text md:min-h-9">
            Export all matching
          </Link>
        </div>}
      />
      <section aria-label="Assessment directory filters"
        className="border-b border-border pb-6">
        <form method="get"
          action={isAssignment ? "/college/assignments" : "/college/quizzes"}
          className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-3)] [&>label]:min-w-[min(100%,13rem)]">
          <label className="grid min-w-52 flex-1 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Search title
            <Input name="q" type="search" maxLength={100}
              defaultValue={data.query.q} placeholder="Assessment title"
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              {!isAssignment ? <option value="CLOSED">Closed</option> : null}
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <CollegeAssessmentCourseSectionFilters courses={data.directoryCourses}
            sections={data.directorySections} initialCourseCode={data.query.courseCode??""}
            initialDeliveryId={data.query.deliveryId??""}/>
          <details open={Boolean((data.query.scope && data.query.scope !== "ALL") || data.query.cohortCode || data.query.programCode || data.query.periodCode || (data.query.duePresence && data.query.duePresence !== "ALL") || (data.query.dueWindow && data.query.dueWindow !== "ALL") || (!isAssignment && data.query.results !== "ALL"))} className="min-w-0 basis-full">
            <summary className="flex min-h-11 cursor-pointer items-center text-[var(--lms-font-base)] font-semibold text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Assessment directory filters</summary>
            <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-wrap items-end gap-[var(--lms-space-3)]">
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Batch / cohort code (exact)
            <Input name="cohortCode" type="search" maxLength={64} defaultValue={data.query.cohortCode??""}
              className="min-h-11 md:min-h-9"/>
          </label>
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Program code (exact)
            <Input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode??""}
              className="min-h-11 md:min-h-9"/>
          </label>
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Audience scope
            <Select name="scope" defaultValue={data.query.scope}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All scopes</option><option value="SHARED">Shared offering</option>
              <option value="SECTION">Section-specific</option>
            </Select>
          </label>
          {!isAssignment?<label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Quiz results
            <Select name="results" defaultValue={data.query.results}
              className="min-h-11 md:min-h-9">
              <option value="ALL">Any visibility</option><option value="PUBLISHED">Results published</option>
              <option value="HIDDEN">Results hidden</option>
            </Select>
          </label>:null}
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Due-date configuration
            <Select name="duePresence" defaultValue={data.query.duePresence}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All deadlines</option><option value="SCHEDULED">Deadline configured</option>
              <option value="UNSCHEDULED">No deadline</option>
            </Select>
          </label>
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Deadline window
            <Select name="dueWindow" defaultValue={data.query.dueWindow}
              className="min-h-11 md:min-h-9">
              <option value="ALL">Any deadline</option><option value="PAST">Deadline passed</option>
              <option value="FUTURE">Deadline upcoming</option>
            </Select>
          </label>
          <label className="grid min-w-40 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Academic period code
            <Input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode??""}
              className="min-h-11 md:min-h-9"/>
          </label>

            </div>
          </details>
          <Button type="submit"
            className="min-h-11 md:min-h-9">
            Filter
          </Button>
          <Link href={collegeAssessmentHref(data.kind, { q: "", scope: "ALL", results: "ALL", duePresence: "ALL", dueWindow: "ALL", status: "ALL", page: 1 })}
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">
            Clear
          </Link>
        </form>
      </section>

      {!isAssignment && leading ? <section aria-label="New assessment" className="min-w-0 border-b border-border pb-4">{leading}</section> : null}

      <section aria-label={name+" records"} className="min-w-0">
        <DataTable
          caption={name+" records"}
          mobileMode="scroll"
          rows={data.items}
          getRowKey={item=>item.id}
          empty={<EmptyState
            title={data.total===0
              ? isAssignment?"No assignments found for this college":"No quizzes found for this college"
              :"No records on this page"}
            description={data.total===0?"Try adjusting your filters.":"Return to an earlier page."}/>}
          columns={isAssignment?[
            {key:"title",header:"Title",mobilePriority:"primary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><div className="max-w-[230px] break-words">
                <strong>{item.title.trim()||"Untitled"}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{item.status}</span>
              </div>},
            {key:"course",header:"Course",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><Link
                href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                className="block max-w-[180px] min-h-9 font-semibold text-primary-text hover:underline">
                {item.courseName.trim()||"Course "+item.courseCode}</Link>},
            {key:"scope",header:"Scope",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><StatusBadge
                tone={item.deliverySpecific?"warning":"neutral"}>
                {item.deliverySpecific?"One section"+(item.sectionName?" · "+item.sectionName:""):"All eligible sections"}
              </StatusBadge>},
            {key:"points",header:"Points",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=>item.points},
            {key:"deadline",header:"Deadline",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><span className="whitespace-nowrap">{formatDue(item.dueAt)}</span>},
            {key:"submissions",header:"Submissions",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><div className="min-w-[145px] space-y-1">
                <p>{item.submittedLearners}/{item.eligibleLearners} submitted</p>
                <p>{item.gradedLearners} graded · {Math.max(0,item.submittedLearners-item.gradedLearners)} not graded</p>
              </div>},
            {key:"actions",header:"Actions",mobilePriority:"action" as const,
              className:"md:sticky md:right-0 md:z-20 md:bg-surface min-w-[230px]",
              cell:(item:CollegeAssessmentAggregateItem)=><div className="flex flex-wrap gap-2">
                <SuperAdminAssignmentSubmissionsDialog title={item.title||"Untitled"} count={item.submittedLearners}>
                  <CollegeAssignmentReview assignmentId={item.id} offeringId={item.offeringId}
                    specificDeliveryId={item.deliveryId} maxPoints={item.points}
                    status={item.status} deliveries={data.reviewDeliveries}
                    filesEnabled={assignmentFilesEnabled}/>
                </SuperAdminAssignmentSubmissionsDialog>
                <CollegeAssignmentActions assignment={item}/>
              </div>},
          ]:[
            {key:"title",header:"Title",mobilePriority:"primary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><strong className="block max-w-[225px] break-words">
                {item.title.trim()||"Untitled quiz"}</strong>},
            {key:"course",header:"Course",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><Link
                href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                className="block max-w-[180px] min-h-9 font-semibold text-primary-text hover:underline">
                {item.courseName.trim()||"Course "+item.courseCode}</Link>},
            {key:"status",header:"Status",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><StatusBadge
                tone={item.status==="PUBLISHED"?"success":"neutral"}>{collegeStatusLabel(item.status)}</StatusBadge>},
            {key:"results",header:"Results",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><StatusBadge
                tone={item.resultsPublished?"success":"neutral"}>{item.resultsPublished?"Released":"Withheld"}</StatusBadge>},
            {key:"audience",header:"Audience",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=>item.deliverySpecific
                ?"One section"+(item.sectionName?" · "+item.sectionName:""):"All eligible sections"},
            {key:"points",header:"Points",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=>item.points},
            {key:"due",header:"Due",mobilePriority:"secondary" as const,
              cell:(item:CollegeAssessmentAggregateItem)=><span className="whitespace-nowrap">{formatDue(item.dueAt)}</span>},
            {key:"actions",header:"Actions",mobilePriority:"action" as const,
              className:"md:sticky md:right-0 md:z-20 md:bg-surface min-w-[240px]",
              cell:(item:CollegeAssessmentAggregateItem)=><div className="flex min-w-[210px] flex-col gap-2">
                <CollegeQuizActions quiz={item}/>
                <div className="flex flex-wrap items-center gap-2">
                  <QuizListActions item={item}/>
                  <SuperAdminQuizSubmissionsDialog title={item.title||"Untitled quiz"} count={item.activityCount}>
                    <CollegeQuizAttempts quizId={item.id} offeringId={item.offeringId}
                      specificDeliveryId={item.deliveryId}
                      deliveries={data.reviewDeliveries} status={item.status}/>
                  </SuperAdminQuizSubmissionsDialog>
                </div>
              </div>},
          ]}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {data.page} of {data.totalPages} · {data.total} records · {data.pageSize}/page
        </p>
        <Pagination page={data.page} pageCount={data.totalPages}
          hrefForPage={page=>collegeAssessmentHref(data.kind,{...data.query,page})}
          label={name+" pagination"} showBoundaryLinks={false}/>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Submitted means distinct active enrolled learners with a submission or attempt.
        Denominators count active eligible learners across this assessment’s Section audience.
        Not graded is submitted minus graded for currently eligible learners, not a historical count.
        Graded counts active learners with graded submissions. The activity summary above
        separately counts all recorded rows, including historical attempts.
        Draft and archived items remain visible to authorized College Admins.
        No answers, submission content, contact information or file keys are read.
        Exact legacy authoring actions, report drill-ins, browser parity and runtime
        integration verification remain open.
      </p>
    </div>
  );
}
