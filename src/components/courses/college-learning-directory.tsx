import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { collegeLearningHref, collegeProgressDescription } from "@/modules/courses/college-learning-directory-model";
import type {
  listCollegeCourseProgress,
  listCollegeLessons,
} from "@/modules/courses/college-learning-directory-service";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeLessons>>
  | Awaited<ReturnType<typeof listCollegeCourseProgress>>;

export function CollegeLearningDirectory({ data }: { data: DirectoryData }) {
  const lessons = data.kind === "LESSONS";
  const title = lessons ? "Lessons" : "Course Progress";
  const href = lessons ? "/college/lessons" : "/college/course-progress";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={title}
        description={lessons
          ? "Read-only lesson catalogue across college course offerings and learning paths."
          : "Persisted learner content activity by offering. Not a course-completion rate or academic eligibility report."}
        actions={
          <Link href="/college/courses"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Course offerings
          </Link>
        }
      />
      <section aria-label={title + " filters"} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form method="get" action={href} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold text-body">
            Course or {lessons ? "lesson" : "cohort"}
            <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              placeholder="Search registered records"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent program lifecycle
              <select name="programStatus" defaultValue={data.query.programStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent batch lifecycle
              <select name="cohortStatus" defaultValue={data.query.cohortStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period lifecycle
              <select name="periodStatus" defaultValue={data.query.periodStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent course lifecycle
              <select name="courseStatus" defaultValue={data.query.courseStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Department code (exact)
              <input type="search" name="departmentCode" maxLength={64} defaultValue={data.query.departmentCode ?? ""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            {lessons ? "Lesson status" : "Offering status"}
            <select name="status" defaultValue={data.query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </select>
          </label>
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period code (exact)
              <input name="periodCode" type="search" maxLength={64}
                defaultValue={data.query.periodCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Batch code (exact)
              <input name="cohortCode" type="search" maxLength={64}
                defaultValue={data.query.cohortCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Program code (exact)
              <input name="programCode" type="search" maxLength={64}
                defaultValue={data.query.programCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course code (exact)
              <input name="courseCode" type="search" maxLength={64}
                defaultValue={data.query.courseCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Course offering type
              <select name="offeringType" defaultValue={data.query.offeringType??"ALL"}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any offering type</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Course department name (exact)
              <input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Published and visibility-flagged content
              <select name="flaggedVisibility" defaultValue={data.query.flaggedVisibility} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_FLAGGED">Has flagged content</option><option value="NONE_FLAGGED">No flagged content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Authored assignments
              <select name="assignmentPresence" defaultValue={data.query.assignmentPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_ASSIGNMENTS">Has assignments</option><option value="NO_ASSIGNMENTS">No assignments</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Authored quizzes
              <select name="quizPresence" defaultValue={data.query.quizPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_QUIZZES">Has quizzes</option><option value="NO_QUIZZES">No quizzes</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Published lesson content
              <select name="publishedContent" defaultValue={data.query.publishedContent} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any publication</option><option value="HAS_PUBLISHED">Has published content</option><option value="NONE_PUBLISHED">No published content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Authored lesson items
              <select name="contentPresence" defaultValue={data.query.contentPresence??"ALL"}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_CONTENT">Contains authored content</option>
                <option value="EMPTY">No content authored</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Learning path lifecycle
              <select name="pathStatus" defaultValue={data.query.pathStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All paths</option>
                <option value="DRAFT">Draft paths</option><option value="PUBLISHED">Published paths</option>
                <option value="ARCHIVED">Archived paths</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Offering lifecycle
              <select name="offeringStatus" defaultValue={data.query.offeringStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option>
                <option value="ACTIVE">Active offerings</option>
                <option value="ARCHIVED">Archived offerings</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course offering type
              <select name="offeringType" defaultValue={data.query.offeringType??"ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course department (exact name)
              <input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Recorded learner activity
              <select name="activityState" defaultValue={data.query.activityState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="RECORDED">Has activity rows</option><option value="UNRECORDED">No recorded activity</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Content completion evidence
              <select name="completionEvidence" defaultValue={data.query.completionEvidence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="COMPLETED_CONTENT">Has completed content records</option><option value="NO_COMPLETED_CONTENT">No completed content records</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Shared learning path
              <select name="learningPathPresence" defaultValue={data.query.learningPathPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_PATH">Has a path</option><option value="NO_PATH">No learning path</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Published learning path
              <select name="publishedPathPresence" defaultValue={data.query.publishedPathPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any publication</option><option value="HAS_PUBLISHED_PATH">Published path exists</option><option value="NO_PUBLISHED_PATH">No published path</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Batch / cohort code (exact)
              <input name="cohortCode" type="search" maxLength={64}
                defaultValue={data.query.cohortCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period code (exact)
              <input name="periodCode" type="search" maxLength={64}
                defaultValue={data.query.periodCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Program code (exact)
              <input name="programCode" type="search" maxLength={64}
                defaultValue={data.query.programCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course code (exact)
              <input name="courseCode" type="search" maxLength={64}
                defaultValue={data.query.courseCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          <button type="submit"
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">Filter</button>
          <Link href={href} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>
      <section aria-label={title + " records"} className="overflow-x-auto rounded-xl border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {data.total} matching {lessons ? "lessons" : "course offerings"}
        </p>
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? lessons
                ? "No persisted lessons match these filters. Learning paths and lessons may not have been authored."
                : "No course offerings match these filters. No completion or learner activity is inferred."
              : "No records exist on this page. Return to an earlier page."}
          </p>
        ) : (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              {lessons ? <tr>
                <th scope="col" className="px-4 py-3">Lesson / order</th>
                <th scope="col" className="px-4 py-3">Course / offering</th>
                <th scope="col" className="px-4 py-3">Learning path / lesson state</th>
                <th scope="col" className="px-4 py-3">Content records</th>
              </tr> : <tr>
                <th scope="col" className="px-4 py-3">Course / offering</th>
                <th scope="col" className="px-4 py-3">Offering state</th>
                <th scope="col" className="px-4 py-3">Recorded learner activity</th>
              </tr>}
            </thead>
            <tbody>
              {data.kind === "LESSONS"
                ? data.items.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Order {item.sequence + 1}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                        className="font-semibold text-primary-text hover:underline">{item.courseName} ({item.courseCode})</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                    </td>
                    <td className="px-4 py-4 text-body">Path: {item.pathStatus}; Lesson: {item.status}</td>
                    <td className="px-4 py-4 text-body">{item.publishedContentCount} published / {item.contentCount} authored
                      <p className="mt-1 text-xs text-muted-foreground">{item.publishedAndVisibleFlagCount} published and flagged visible to students</p>
                    </td>
                  </tr>
                ))
                : data.items.map((item) => (
                  <tr key={item.offeringId} className="border-t border-border align-top">
                    <td className="px-4 py-4">
                      <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                        className="font-semibold text-primary-text hover:underline">{item.courseName} ({item.courseCode})</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                    </td>
                    <td className="px-4 py-4 text-body">{item.offeringStatus}</td>
                    <td className="px-4 py-4 text-body">{collegeProgressDescription(item)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
        <div className="flex gap-2">
          {data.query.page > 1 ? <Link
            href={collegeLearningHref(data.kind, { ...data.query, page: data.query.page - 1 })}
            className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link> : null}
          {data.query.page < data.totalPages ? <Link
            href={collegeLearningHref(data.kind, { ...data.query, page: data.query.page + 1 })}
            className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link> : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        {lessons
          ? "This catalogue is based on registered lesson and content rows. Content counts include historical draft/archived records; no file URLs or signed media are queried. Creation, editing, ordering and storage remain offering-scoped."
          : "Counts use recorded learner-content progress rows only. Learners without activity are absent from counts. Completion flags reflect individual content records, not finished courses, distinct eligible learners, assignments, quizzes or attendance. Historic records may remain after enrollment changes."}
        Exact legacy reports, exports and browser parity remain unverified.
      </p>
    </div>
  );
}
