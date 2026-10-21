import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";
import { COLLEGE_COURSE_TAB_COPY, collegeAudienceLabel, collegeResultsLabel, collegeStatusLabel } from "@/modules/courses/college-course-tabs-copy";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { FacultyItemActions } from "./faculty-item-actions";
import { AdminQuizResultsActions } from "./admin-learning-structure-actions";
import { CollegeAssignmentReview } from "./college-assignment-review";
import {CollegeAssignmentActions} from "./college-assignment-actions";
import { CollegeAssessmentCourseSectionFilters, type AssessmentDirectoryCourse, type AssessmentDirectorySection } from "./college-assessment-course-section-filters";
import {CollegeQuizActions} from "./college-quiz-actions";
import {CollegeQuizAttempts} from "./college-quiz-attempts";
import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import {collegeAssessmentExportHref} from "@/modules/courses/college-assessment-export-model";
import {
  collegeAssessmentHref,
  collegeAssessmentSummary,
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
  const summary = collegeAssessmentSummary(data.items);

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        eyebrow=""
        title={name}
        description={
          "College-wide persisted " + name.toLowerCase() +
          " across all course offerings and lessons. " +
          "Course authoring and detailed review remain in their offering workspaces."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAssignment ? leading : null}
            {isAssignment ? data.items.length ? <Link prefetch={false} download
              href={collegeAssessmentExportHref(data.kind,data.query,"PAGE")}
              className="inline-flex min-h-11 items-center gap-2 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
              <span aria-hidden="true">↓</span>Export CSV (page)
            </Link> : <Button type="button" variant="secondary" disabled>Export CSV (page)</Button> : null}
            <Link prefetch={false} download href={collegeAssessmentExportHref(data.kind,data.query)}
              className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
              {isAssignment ? "Export all matching" : "Export CSV"}
            </Link>
            <Link href={isAssignment ? "/college/quizzes" : "/college/assignments"}
              className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
              {isAssignment ? "View quizzes" : "View assignments"}
            </Link>
            <Link href="/college/courses"
              className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
              Course catalogue
            </Link>
          </div>
        }
      />
      {!isAssignment && leading ? <section aria-label="New assessment" className="min-w-0 border-b border-border pb-4">{leading}</section> : null}

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

      <section aria-label="Displayed assessment summary" className={isAssignment
        ? "grid gap-3 md:grid-cols-4"
        : "grid gap-3 md:grid-cols-3"}>
        {[
          ["Matching records", data.total],
          ["Published on this page", summary.published],
          [isAssignment ? "Submitted records on this page" : "Quiz attempts on this page", summary.activity],
          ...(isAssignment ? [["Not graded on this page",
            data.items.reduce((sum,item)=>sum+Math.max(0,item.submittedLearners-item.gradedLearners),0)]] : []),
        ].map(([label, value]) => (
          <StatTile key={String(label)} label={String(label)} value={value as number}/>
        ))}
      </section>

      <section aria-label={name + " records"} className="min-w-0 overflow-hidden border-y border-border">
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? "No recorded assessments match these filters. This does not imply courses or lessons are absent."
              : "There are no results on this page. Return to an earlier page."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {data.items.map(item=><article key={item.id} className="min-w-0 space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
                  <StatusBadge tone={item.status==="PUBLISHED"?"success":"neutral"}>{item.status}</StatusBadge>
                </div>
                <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                  className="inline-block min-h-11 break-words py-2 text-sm font-semibold text-primary-text">
                  {item.courseName} ({item.courseCode})
                </Link>
                <p className="break-words text-sm text-body">{item.lessonName}</p>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="font-semibold text-muted-foreground">Audience</dt><dd>{collegeAudienceLabel(item.deliverySpecific)}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">Maximum points</dt><dd>{item.points}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">Due</dt><dd>{formatDue(item.dueAt)}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">Total students eligible</dt>
                    <dd>{item.eligibleLearners}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">Submitted</dt>
                    <dd>{item.submittedLearners}</dd></div>
                  {isAssignment?<div><dt className="font-semibold text-muted-foreground">Graded</dt>
                    <dd>{item.gradedLearners}</dd></div>:null}
                  {isAssignment?<div><dt className="font-semibold text-muted-foreground">Not graded</dt>
                    <dd>{Math.max(0,item.submittedLearners-item.gradedLearners)}</dd></div>:null}
                  {!isAssignment?<div className="col-span-2"><dt className="font-semibold text-muted-foreground">Results</dt><dd><StatusBadge tone={item.resultsPublished?"success":"warning"}>{item.resultsPublished?"Published":"Hidden"}</StatusBadge></dd></div>:null}
                </dl>
                {!isAssignment?<><QuizListActions item={item}/><CollegeQuizActions quiz={item}/><CollegeQuizAttempts quizId={item.id} offeringId={item.offeringId} specificDeliveryId={item.deliveryId} deliveries={data.reviewDeliveries} status={item.status}/></>:null}
                {isAssignment?<CollegeAssignmentActions assignment={item}/>:null}
                {isAssignment?<CollegeAssignmentReview
                 assignmentId={item.id} offeringId={item.offeringId}
                 specificDeliveryId={item.deliveryId} maxPoints={item.points}
                 status={item.status} deliveries={data.reviewDeliveries}
                 filesEnabled={assignmentFilesEnabled}/>:null}
              </article>)}
            </div>
            <div className="hidden min-w-0 md:block">
              <DataTable
                caption={name+" records"}
                rows={data.items}
                getRowKey={item=>item.id}
                empty={<EmptyState title="No matching assessments" description="No recorded assessments match these filters. This does not imply courses or lessons are absent."/>}
                columns={[
                  {key:"assessment",header:isAssignment?"Assignment":"Quiz",mobilePriority:"primary" as const,
                    cell:(item)=><span className="block min-w-0">
                      <strong className="block break-words text-foreground">{item.title}</strong>
                      <span className="text-xs text-muted-foreground">Maximum {item.points} points</span>
                    </span>},
                  {key:"course",header:COLLEGE_COURSE_TAB_COPY.assessmentColumns.course,mobilePriority:"secondary" as const,
                    cell:(item)=><div className="min-w-0">
                      <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                        className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text hover:underline">
                        {item.courseName} ({item.courseCode})
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.lessonName}</p>
                    </div>},
                  {key:"audience",header:COLLEGE_COURSE_TAB_COPY.assessmentColumns.audience,
                    mobilePriority:"secondary" as const,cell:(item)=>collegeAudienceLabel(item.deliverySpecific)},
                  {key:"status",header:"Status",mobilePriority:"secondary" as const,
                    cell:(item)=><StatusBadge tone={item.status==="PUBLISHED"?"success":"neutral"}>
                      {collegeStatusLabel(item.status)}
                    </StatusBadge>},
                  ...(!isAssignment?[{key:"results",header:COLLEGE_COURSE_TAB_COPY.assessmentColumns.results,
                    mobilePriority:"secondary" as const,cell:(item:CollegeAssessmentAggregateItem)=><StatusBadge tone={item.resultsPublished?"success":"warning"}>{collegeResultsLabel(Boolean(item.resultsPublished))}</StatusBadge>}]:[]),
                  {key:"due",header:"Due (IST)",mobilePriority:"secondary" as const,cell:(item)=>formatDue(item.dueAt)},
                  {key:"eligible",header:"Total students",mobilePriority:"secondary" as const,
                    cell:(item)=>item.eligibleLearners},
                  {key:"submitted",header:"Submitted",mobilePriority:"secondary" as const,
                    cell:(item)=>item.submittedLearners},
                  ...(isAssignment?[{key:"graded",header:"Graded / not graded",mobilePriority:"secondary" as const,
                    cell:(item:CollegeAssessmentAggregateItem)=>item.gradedLearners+" graded · "+Math.max(0,item.submittedLearners-item.gradedLearners)+" not graded"}]:[]),
                  {key:"actions",header:"Actions",mobilePriority:"action" as const,
                    cell:(item)=><div className="min-w-0 space-y-2">
                      {isAssignment?<><CollegeAssignmentActions assignment={item}/>
                        <CollegeAssignmentReview assignmentId={item.id} offeringId={item.offeringId}
                          specificDeliveryId={item.deliveryId} maxPoints={item.points}
                          status={item.status} deliveries={data.reviewDeliveries}
                          filesEnabled={assignmentFilesEnabled}/></>:
                       <><QuizListActions item={item}/><CollegeQuizActions quiz={item}/>
                         <CollegeQuizAttempts quizId={item.id} offeringId={item.offeringId}
                           specificDeliveryId={item.deliveryId} deliveries={data.reviewDeliveries}
                           status={item.status}/></>}
                    </div>},
                ]}
              />
            </div>
          </>
        )}
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
