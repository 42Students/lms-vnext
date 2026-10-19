import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {FacultyItemActions} from "@/components/courses/faculty-item-actions";
import {AdminQuizResultsActions} from "@/components/courses/admin-learning-structure-actions";
import {CollegeAssignmentActions} from "@/components/courses/college-assignment-actions";
import {CollegeAssignmentReview} from "@/components/courses/college-assignment-review";
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
export function AdminAssessmentDirectory({ data }: { data: Data }) {
  const assignment = data.kind === "ASSIGNMENT";
  const title = assignment ? "Assignments" : "Quizzes";
  const base = assignment ? "/admin/assignments" : "/admin/quizzes";
  const stats = adminAssessmentStats(data.items);
  return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title={title}
      description={`${title} across the selected college. Submission/attempt counts reflect persisted rows, not distinct learners or completion rates.`} />
    <form action={base} className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2 xl:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Assessment title
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}
          className="min-h-11 sm:min-h-9" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 sm:min-h-9">
          <option value="ALL">All</option><option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          {!assignment ? <option value="CLOSED">Closed</option> : null}
          <option value="ARCHIVED">Archived</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Course code
        <Input name="courseCode" maxLength={64} defaultValue={data.query.courseCode??""} placeholder="All courses" className="min-h-11 sm:min-h-9"/>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Audience
        <Select name="scope" defaultValue={data.query.scope} className="min-h-11 sm:min-h-9">
          <option value="ALL">All audiences</option><option value="SHARED">Shared offering</option><option value="SECTION">Section-specific</option>
        </Select>
      </label>
      {!assignment?<label className="grid gap-1 text-sm font-semibold text-body">Results
        <Select name="results" defaultValue={data.query.results} className="min-h-11 sm:min-h-9">
         <option value="ALL">All results</option><option value="PUBLISHED">Released</option><option value="HIDDEN">Withheld</option>
        </Select>
      </label>:null}
      <Button type="submit" className="min-h-11 self-end">Filter</Button>
    </form>
    <p className="text-sm text-muted-foreground">{data.total} matching records · on this page: {stats.published} published, {stats.activity} {assignment ? "submissions" : "attempts"}</p>
    {data.items.length ? <div className="divide-y divide-border border-y border-border">
      {data.items.map(item => <article key={item.id} className="min-w-0 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
          <StatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>{item.status}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{item.courseName} ({item.courseCode}) · {item.lessonName}</p>
        <p className="mt-2 text-xs text-muted-foreground">{item.deliverySpecific ? "Section-specific" : "Shared offering"} · {item.points} maximum points</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-body">
          <div><dt className="text-xs text-muted-foreground">Due</dt><dd>{formatDue(item.dueAt)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{assignment ? "Submissions" : "Attempts"}</dt>
            <dd className="text-lg font-semibold tabular-nums">{item.activityCount}</dd></div>
        </dl>
        {assignment?<div className="mt-3 space-y-2">
          <CollegeAssignmentActions assignment={{id:item.id,title:item.title,
            points:item.points,dueAt:item.dueAt,status:item.status}}/>
          <CollegeAssignmentReview assignmentId={item.id} offeringId={item.offeringId}
            specificDeliveryId={item.deliveryId} maxPoints={item.points}
            status={item.status} deliveries={data.reviewDeliveries} filesEnabled={false}/>
        </div>:<div className="mt-3 space-y-2">
          <CollegeQuizActions quiz={{id:item.id,title:item.title,status:item.status,dueAt:item.dueAt}}/>
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
          {!assignment&&["DRAFT","PUBLISHED","CLOSED","ARCHIVED"].includes(item.status)?
            <AdminQuizResultsActions quizId={item.id}
              status={item.status as "DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED"}
              resultsPublished={Boolean(item.resultsPublished)}
              deadlineReached={item.resultsReleaseReady}/>:null}
        </div>
        <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}#lesson-authoring`}
          className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Open offering builder / submissions →
        </Link>
      </article>)}
    </div> : <EmptyState title={assignment?"No assignments found for this college":"No quizzes found for this college"} description="Try adjusting your filters." />}
    <nav aria-label={title + " pages"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {data.page} of {data.totalPages} · 25 per page</span>
      <div className="flex gap-2">
        {data.page > 1 ? <Link href={adminAssessmentHref(data.kind, { ...data.query, page: data.page - 1 })}
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Previous</Link> : null}
        {data.page < data.totalPages ? <Link href={adminAssessmentHref(data.kind, { ...data.query, page: data.page + 1 })}
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">No answers, submission body, learner contacts or stored attachments are fetched by this directory.</p>
    <Link href="/admin/courses" className="inline-flex min-h-11 sm:min-h-9 items-center font-semibold text-primary-text">← Courses</Link>
  </div>;
}
