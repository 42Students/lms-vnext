import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {FacultyItemActions} from "@/components/courses/faculty-item-actions";
import {AdminQuizResultsActions} from "@/components/courses/admin-learning-structure-actions";
import {CollegeAssignmentActions} from "@/components/courses/college-assignment-actions";
import {CollegeAssessmentCourseSectionFilters} from "@/components/courses/college-assessment-course-section-filters";
import {CollegeAssignmentReview} from "@/components/courses/college-assignment-review";
import {SuperAdminAssignmentSubmissionsDialog} from "@/components/courses/superadmin-assignment-submissions-dialog";
import {CollegeQuizActions} from "@/components/courses/college-quiz-actions";
import {CollegeQuizAttempts} from "@/components/courses/college-quiz-attempts";
import { adminAssessmentHref, adminAssessmentStats } from "@/modules/courses/admin-assessment-directory-model";
import type { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

type Data = Awaited<ReturnType<typeof listCollegeAssessmentAggregate>>;
function formatDue(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(value) + " IST" : "Not scheduled";
}
export function AdminAssessmentDirectory({ data, showHeader = true }: { data: Data; showHeader?: boolean }) {
  const assignment = data.kind === "ASSIGNMENT";
  const title = assignment ? "Assignments" : "Quizzes";
  const base = assignment ? "/admin/assignments" : "/admin/quizzes";
  const stats = adminAssessmentStats(data.items);
  return <div className="min-w-0 space-y-4 md:space-y-6">
    {showHeader ? <PageHeader eyebrow="Super Admin · Courses" title={title}
      description={`${title} across the selected college. Submission/attempt counts reflect persisted rows, not distinct learners or completion rates.`} /> : null}
    <FilterBar title="Assessment filters"><form action={base} className="grid min-w-0 gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)] md:grid-cols-2 xl:grid-cols-3 print:hidden">
      <label className="grid gap-[var(--lms-space-1)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Assessment title
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}
          className="min-h-11 md:min-h-9" />
      </label>
      <label className="grid gap-[var(--lms-space-1)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
          <option value="ALL">All</option><option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          {!assignment ? <option value="CLOSED">Closed</option> : null}
          <option value="ARCHIVED">Archived</option>
        </Select>
      </label>
      {/* The controlled course datalist and Section selector are populated from
          the tenant-authorized full directory, not this paginated page.
          Changing course clears the Section selector without a forged ID. */}
      <CollegeAssessmentCourseSectionFilters courses={data.directoryCourses}
        sections={data.directorySections} initialCourseCode={data.query.courseCode??""}
        initialDeliveryId={data.query.deliveryId??""}/>
      <label className="grid gap-[var(--lms-space-1)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Audience
        <Select name="scope" defaultValue={data.query.scope} className="min-h-11 md:min-h-9">
          <option value="ALL">All scopes</option><option value="SHARED">Shared offering</option><option value="SECTION">Section-specific</option>
        </Select>
      </label>
      {!assignment?<label className="grid gap-[var(--lms-space-1)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Results
        <Select name="results" defaultValue={data.query.results} className="min-h-11 md:min-h-9">
         <option value="ALL">All results</option><option value="PUBLISHED">Released</option><option value="HIDDEN">Withheld</option>
        </Select>
      </label>:null}
      <Button variant="primary" type="submit" className="min-h-11 self-end md:min-h-9">Search</Button>
    </form></FilterBar>
    <p className="m-0 break-words text-sm text-muted-foreground leading-[22px]">{data.total} matching records · on this page: {stats.published} published, {stats.activity} {assignment ? "submissions" : "attempts"}</p>
    {data.items.length && assignment ?
      <div className="min-w-0 overflow-x-auto border-y border-[var(--lms-canvas-border)]" role="region" aria-label="Assignment directory" tabIndex={0}>
        <table className="w-full min-w-[1030px] border-collapse text-left text-sm">
          <caption className="sr-only">College assignments. Table scrolls horizontally on smaller screens.</caption>
          <thead><tr className="border-b border-border bg-muted text-xs font-semibold">
            {["Title","Course","Scope","Points","Deadline","Submissions","Actions"].map(column=>
              <th key={column} scope="col" className="px-3 py-3">{column}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {data.items.map(item=><tr key={item.id} className="align-top hover:bg-muted/40">
              <td className="px-3 py-3"><span className="block max-w-[220px] break-words font-semibold">{item.title}</span>
                <StatusBadge tone={item.status==="PUBLISHED"?"success":"neutral"}>{item.status}</StatusBadge></td>
              <td className="px-3 py-3">{item.courseName} ({item.courseCode})</td>
              <td className="px-3 py-3">{item.deliverySpecific?"Section-specific":"All eligible sections"}</td>
              <td className="px-3 py-3 tabular-nums">{item.points}</td>
              <td className="px-3 py-3 whitespace-nowrap">{formatDue(item.dueAt)}</td>
              <td className="px-3 py-3">
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge tone="neutral">{item.submittedLearners}/{item.eligibleLearners} submitted</StatusBadge>
                  <StatusBadge tone={item.gradedLearners>0?"success":"neutral"}>{item.gradedLearners} graded</StatusBadge>
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="flex min-w-[200px] flex-col items-start gap-2">
                  <SuperAdminAssignmentSubmissionsDialog title={item.title} count={item.submittedLearners}>
                    <CollegeAssignmentReview assignmentId={item.id} offeringId={item.offeringId}
                      specificDeliveryId={item.deliveryId} maxPoints={item.points}
                      gradedLearners={item.gradedLearners} status={item.status}
                      deliveries={data.reviewDeliveries} filesEnabled={false}/>
                  </SuperAdminAssignmentSubmissionsDialog>
                  <CollegeAssignmentActions assignment={{id:item.id,title:item.title,
                    points:item.points,dueAt:item.dueAt,status:item.status}}/>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div> : data.items.length ? <div className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
      {data.items.map(item => <article key={item.id} className="min-w-0 py-[var(--lms-space-4)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{item.title}</h2>
          <StatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>{item.status}</StatusBadge>
        </div>
        <p className="mt-1 break-words text-sm text-body leading-[22px]">{item.courseName} ({item.courseCode}) · {item.lessonName}</p>
        <p className="mt-2 break-words text-xs text-muted-foreground leading-[20px]">{item.deliverySpecific ? "Section-specific" : "Shared offering"} · {item.points} maximum points</p>
        <dl className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] text-sm text-body">
          <div><dt className="text-xs text-muted-foreground">Due</dt><dd className="break-words">{formatDue(item.dueAt)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{assignment ? "Submissions" : "Attempts"}</dt>
            <dd className="text-lg font-semibold tabular-nums">{item.activityCount}</dd></div>
        </dl>
        {assignment?<div className="mt-3 space-y-2">
          <CollegeAssignmentActions assignment={{id:item.id,title:item.title,
            points:item.points,dueAt:item.dueAt,status:item.status}}/>
          <Disclosure title={`Submissions · ${item.activityCount}`} className="mt-[var(--lms-space-3)]"
            contentClassName="pb-[var(--lms-space-3)]">
            <CollegeAssignmentReview assignmentId={item.id} offeringId={item.offeringId}
              specificDeliveryId={item.deliveryId} maxPoints={item.points}
              status={item.status} deliveries={data.reviewDeliveries} filesEnabled={false}/>
          </Disclosure>
        </div>:<div className="mt-3 space-y-2">
          <CollegeQuizActions quiz={{id:item.id,title:item.title,status:item.status,dueAt:item.dueAt}}/>
          {item.activityCount > 0 ? <p className="text-xs leading-5 text-muted-foreground">
            {item.activityCount} recorded attempt(s). Questions and attempt settings must remain immutable; edit metadata only after the server preflight.
          </p> : null}
          <CollegeQuizAttempts quizId={item.id} offeringId={item.offeringId}
            specificDeliveryId={item.deliveryId} deliveries={data.reviewDeliveries}
            status={item.status}/>
        </div>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FacultyItemActions
            transitionUrl={"/api/courses/"+(assignment?"assignments":"quizzes")+"/"+item.id+"/transition"}
            actions={item.status==="DRAFT"?["PUBLISH","ARCHIVE"]:
              item.status==="PUBLISHED"&&!assignment?["CLOSE","ARCHIVE"]:
              item.status==="PUBLISHED"?["ARCHIVE"]:[]}/>
          {!assignment && (item.resultsReleaseReady || item.resultsPublished) &&
            (item.status==="PUBLISHED" || item.status==="CLOSED") ?
            <AdminQuizResultsActions quizId={item.id}
              status={item.status as "PUBLISHED"|"CLOSED"}
              resultsPublished={Boolean(item.resultsPublished)}
              deadlineReached={item.resultsReleaseReady}/>:null}
          {!assignment && !item.resultsReleaseReady && !item.resultsPublished &&
            (item.status==="PUBLISHED" || item.status==="CLOSED") ?
            <p role="status" className="text-xs text-muted-foreground">
              Results may be released only after the quiz deadline and authorized review.
            </p> : null}
        </div>
        <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}#lesson-authoring`}
          className="mt-3 inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text underline print:hidden focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Open offering builder / submissions →
        </Link>
      </article>)}
    </div> : <EmptyState title={assignment?"No assignments found for this college":"No quizzes found for this college"} description="Try adjusting your filters." />}
    <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between print:hidden">
      <span className="text-xs text-muted-foreground">{data.pageSize} per page</span>
      <Pagination page={data.page} pageCount={data.totalPages}
        hrefForPage={page => adminAssessmentHref(data.kind, { ...data.query, page })}
        label={title + " pages"} showBoundaryLinks={false} />
    </div>
    <p className="text-xs text-muted-foreground leading-[20px]">
      Search and Section filters use authorized College options. Quiz mutation uses a preflight
      editor and the service enforces result-release and attempt-history rules. Submissions
      are reviewed in the selected Section; the shared review control uses an accessible
      confirmation before publishing grades. No answers, submission body, learner contacts
      or stored attachments are fetched by this directory.
    </p>
    <Link href="/admin/courses" className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 print:hidden">← Courses</Link>
  </div>;
}
