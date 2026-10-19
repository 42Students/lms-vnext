import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { COLLEGE_COURSE_TAB_COPY, collegeAudienceLabel, collegeResultsLabel, collegeStatusLabel } from "@/modules/courses/college-course-tabs-copy";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { FacultyItemActions } from "./faculty-item-actions";
import { AdminQuizResultsActions } from "./admin-learning-structure-actions";
import { CollegeAssignmentReview } from "./college-assignment-review";
import {CollegeAssignmentActions} from "./college-assignment-actions";
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
 return <div className="space-y-2">
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

export function CollegeAssessmentAggregate({ data }: { data: Data }) {
  const isAssignment = data.kind === "ASSIGNMENT";
  const assignmentFilesEnabled=isAssignment&&assignmentFilesRuntimeEnabled();
  const name = isAssignment ? "Assignments" : "Quizzes";
  const summary = collegeAssessmentSummary(data.items);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={name}
        description={
          "College-wide persisted " + name.toLowerCase() +
          " across all course offerings and lessons. " +
          "Course authoring and detailed review remain in their offering workspaces."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link prefetch={false} download href={collegeAssessmentExportHref(data.kind,data.query)}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Export CSV
            </Link>
            <Link href={isAssignment ? "/college/quizzes" : "/college/assignments"}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              {isAssignment ? "View quizzes" : "View assignments"}
            </Link>
            <Link href="/college/courses"
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Course catalogue
            </Link>
          </div>
        }
      />

      <section aria-label="Assessment directory filters"
        className="rounded-xl border border-border bg-surface p-5">
        <form method="get"
          action={isAssignment ? "/college/assignments" : "/college/quizzes"}
          className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
            Search title
            <Input name="q" type="search" maxLength={100}
              defaultValue={data.query.q} placeholder="Assessment title"
              className="min-h-11" />
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Exact course code
            <Input name="courseCode" type="search" maxLength={64} defaultValue={data.query.courseCode??""}
              className="min-h-11" />
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Batch / cohort code (exact)
            <Input name="cohortCode" type="search" maxLength={64} defaultValue={data.query.cohortCode??""}
              className="min-h-11"/>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Program code (exact)
            <Input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode??""}
              className="min-h-11"/>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Audience scope
            <Select name="scope" defaultValue={data.query.scope}
              className="min-h-11">
              <option value="ALL">All scopes</option><option value="SHARED">Shared offering</option>
              <option value="SECTION">Section-specific</option>
            </Select>
          </label>
          {!isAssignment?<label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Quiz results
            <Select name="results" defaultValue={data.query.results}
              className="min-h-11">
              <option value="ALL">Any visibility</option><option value="PUBLISHED">Results published</option>
              <option value="HIDDEN">Results hidden</option>
            </Select>
          </label>:null}
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Due-date configuration
            <Select name="duePresence" defaultValue={data.query.duePresence}
              className="min-h-11">
              <option value="ALL">All deadlines</option><option value="SCHEDULED">Deadline configured</option>
              <option value="UNSCHEDULED">No deadline</option>
            </Select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Deadline window
            <Select name="dueWindow" defaultValue={data.query.dueWindow}
              className="min-h-11">
              <option value="ALL">Any deadline</option><option value="PAST">Deadline passed</option>
              <option value="FUTURE">Deadline upcoming</option>
            </Select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Academic period code
            <Input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode??""}
              className="min-h-11"/>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              {!isAssignment ? <option value="CLOSED">Closed</option> : null}
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <Button type="submit"
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
            Filter
          </Button>
          <Link href={collegeAssessmentHref(data.kind, { q: "", scope: "ALL", results: "ALL", duePresence: "ALL", dueWindow: "ALL", status: "ALL", page: 1 })}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>

      <section aria-label="Displayed assessment summary" className="grid gap-3 sm:grid-cols-3">
        {[
          ["Matching records", data.total],
          ["Published on this page", summary.published],
          [isAssignment ? "Submitted records on this page" : "Quiz attempts on this page", summary.activity],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </article>
        ))}
      </section>

      <section aria-label={name + " records"} className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? "No recorded assessments match these filters. This does not imply courses or lessons are absent."
              : "There are no results on this page. Return to an earlier page."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-border sm:hidden">
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
                  <div><dt className="font-semibold text-muted-foreground">Submitted</dt>
                    <dd>{item.submittedLearners}/{item.eligibleLearners}</dd></div>
                  {isAssignment?<div><dt className="font-semibold text-muted-foreground">Graded</dt>
                    <dd>{item.gradedLearners} graded</dd></div>:null}
                  {!isAssignment?<div className="col-span-2"><dt className="font-semibold text-muted-foreground">Results</dt><dd>{item.resultsPublished?"Published":"Hidden"}</dd></div>:null}
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
            <div className="hidden min-w-0 sm:block">
              <DataTable
                caption={name+" records"}
                rows={data.items}
                getRowKey={item=>item.id}
                empty={<p className="p-4 text-sm text-body">No recorded assessments match these filters. This does not imply courses or lessons are absent.</p>}
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
                    mobilePriority:"secondary" as const,cell:(item:CollegeAssessmentAggregateItem)=>collegeResultsLabel(Boolean(item.resultsPublished))}]:[]),
                  {key:"due",header:"Due (IST)",mobilePriority:"secondary" as const,cell:(item)=>formatDue(item.dueAt)},
                  {key:"submitted",header:"Submitted / eligible",mobilePriority:"secondary" as const,
                    cell:(item)=>item.submittedLearners+"/"+item.eligibleLearners+" submitted"},
                  ...(isAssignment?[{key:"graded",header:"Graded",mobilePriority:"secondary" as const,
                    cell:(item:CollegeAssessmentAggregateItem)=>item.gradedLearners+" graded"}]:[]),
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

      <nav aria-label={name + " pagination"}
        className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {data.page} of {data.totalPages} · {data.total} records · 25/page
        </p>
        <div className="flex gap-2">
          {data.page > 1 ? (
            <Link href={collegeAssessmentHref(data.kind, { ...data.query, page: data.page - 1 })}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Previous
            </Link>
          ) : null}
          {data.page < data.totalPages ? (
            <Link href={collegeAssessmentHref(data.kind, { ...data.query, page: data.page + 1 })}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Next
            </Link>
          ) : null}
        </div>
      </nav>

      <p className="text-xs leading-5 text-muted-foreground">
        Submitted means distinct active enrolled learners with a submission or attempt.
        Denominators count active eligible learners across this assessment’s Section audience.
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
