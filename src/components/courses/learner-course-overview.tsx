import Link from "next/link";
import { learnerUpcomingQuizEligible } from "@/modules/courses/learner-course-upcoming-quiz-model";
import { learnerCourseHomeCompletion } from "@/modules/courses/learner-course-home-completion-model";
import { learnerCourseHomeActionLabel } from "@/modules/courses/learner-course-home-action-label-model";
import { formatLearnerCourseMoment } from "@/modules/courses/learner-course-date-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpandableCourseDescription } from "./expandable-course-description";
import { ExpandableCourseUpdate } from "./expandable-course-update";
import { selectPriorityLearnerActivity } from "@/modules/courses/learner-overview-priority";
import { learnerProgressAvailability } from "@/modules/courses/learner-progress-availability";
import { learnerCoursePathPreview } from "@/modules/courses/learner-course-path-preview-model";
import { learnerCourseAboutSource } from "@/modules/courses/learner-course-about-model";
import { learnerRecentCourseActivity } from "@/modules/courses/learner-recent-course-activity-model";
import { learnerCourseOverviewJumps } from "@/modules/courses/learner-course-overview-mobile-model";
import type { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";

type Workspace = Awaited<ReturnType<typeof getLearnerCourseWorkspace>>;

type CourseMeta = {
  courseDescription: string | null;
  introductionText: string | null;
  bodyHtml: string | null;
  takeaways: string[];
  offeringType: string;
  credits: number | null;
  sectionName: string;
  sectionCode: string;
  academicPeriodName: string;
  instructors: Array<{
    membershipId: string;
    role: string;
    name: string;
  }>;
};

function formatWhen(value: Date | null) {
  return formatLearnerCourseMoment(value);
}

function nextFilter(workspace: Workspace) {
  const next = workspace.nextItem;
  if (!next) return "all";
  if (next.kind === "ASSIGNMENT" || next.kind === "QUIZ") {
    return "assessments";
  }
  const lesson = workspace.lessons.find((item) => item.id === next.lessonId);
  const content = lesson?.contents.find((item) => item.id === next.itemId);
  if (content?.type === "RESOURCE") return "resources";
  if (content?.type === "LIVE_CLASS") return "live-sessions";
  return "lectures";
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p>
    </section>
  );
}

export function LearnerCourseOverview({
  deliveryId,
  workspace,
  meta,
  readOnly = false,
  courseUpdates = [],
}: {
  deliveryId: string;
  workspace: Workspace;
  meta: CourseMeta;
  readOnly?: boolean;
  courseUpdates?: Array<{
    id: string;
    senderName: string;
    messageText: string;
    pinned: boolean;
    createdAt: Date;
  }>;
}) {
  const summary = workspace.summary;
  const pathPreview = learnerCoursePathPreview(workspace.lessons);
  const aboutSource = learnerCourseAboutSource({
    safeBodyHtml: meta.bodyHtml,
    courseDescription:meta.courseDescription,
    learningPathDescription:workspace.learningPath?.description??null,
    introductionText:meta.introductionText,
    takeaways:meta.takeaways,
  });
  const progressAvailability = learnerProgressAvailability({
    hasPublishedLearningPath: workspace.learningPath !== null,
    publishedLessonCount: workspace.lessons.length,
    trackableItemCount: summary.itemsTotal,
  });
  const next = workspace.nextItem;
  const nextContent = workspace.nextContent;
  const now = workspace.snapshotNowMs;
  const activityCutoff = now + 14 * 24 * 60 * 60 * 1000;

  // Legacy parity: takeaways are explicitly authored Course Home metadata.
  // Lesson titles are curriculum structure and must never be relabeled as
  // learner outcomes when the Course has no authored takeaways.
  const learningTakeaways =
    meta.takeaways;

  const allUpcomingActivity = workspace.lessons
    .flatMap((lesson) => [
      ...lesson.assignments
        .filter(
          (item) =>
            item.progress.status !== "COMPLETED" &&
            Boolean(item.dueAt) &&
            item.dueAt!.getTime() >= now &&
            item.dueAt!.getTime() <= activityCutoff,
        )
        .map((item) => ({
          id: item.id,
          lessonId: lesson.id,
          title: item.title,
          type: "Assignment" as const,
          when: item.dueAt,
          filter: "assessments",
          priority: item.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
        })),
      ...lesson.quizzes
        .filter(
          (item) => learnerUpcomingQuizEligible({
            status:item.progress.status,dueAt:item.dueAt,
          },now,activityCutoff),
        )
        .map((item) => ({
          id: item.id,
          lessonId: lesson.id,
          title: item.title,
          type: "Quiz" as const,
          when: item.dueAt,
          filter: "assessments",
          priority: item.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
        })),
      ...lesson.contents
        .filter(
          (item) =>
            item.type === "LIVE_CLASS" &&
            item.progress.status !== "COMPLETED" &&
            Boolean(item.startsAt) &&
            item.startsAt!.getTime() >= now &&
            item.startsAt!.getTime() <= activityCutoff,
        )
        .map((item) => ({
          id: item.id,
          lessonId: lesson.id,
          title: item.title,
          type: "Live Session" as const,
          when: item.startsAt,
          filter: "live-sessions",
          priority: item.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
        })),
    ])
    .sort((left, right) => left.priority - right.priority);
  // Keep the update feed time-ordered, but never allow its six-item display
  // cap to hide an assessment when picking the next action.
  const activity = allUpcomingActivity.slice(0, 6);
  const recentLearnerActivity=learnerRecentCourseActivity(workspace.lessons,now).slice(0,2);
  // Late submissions remain actionable for published assignments. They must
  // not be hidden merely because the upcoming feed only covers future dates.
  const overdueAssignmentActions = workspace.lessons.flatMap((lesson) =>
    lesson.assignments
      .filter((item) => item.progress.status !== "COMPLETED" &&
        item.dueAt && Number.isFinite(item.dueAt.getTime()) && item.dueAt.getTime() < now)
      .map((item) => ({
        id: item.id, lessonId: lesson.id, title: item.title,
        type: "Assignment" as const, when: item.dueAt,
        filter: "assessments", priority: item.dueAt!.getTime(), overdue: true,
      })),
  );
  const priorityActivity = readOnly
    ? null
    : selectPriorityLearnerActivity([...overdueAssignmentActions, ...allUpcomingActivity]);
  const nextAction = readOnly ? null : priorityActivity
    ? {
        title: priorityActivity.title,
        detail: `${("overdue" in priorityActivity && priorityActivity.overdue) ? "Overdue · late submission available" : priorityActivity.type}${priorityActivity.when ? ` · ${formatWhen(priorityActivity.when)}` : ""}`,
        href: `/learn/courses/${deliveryId}/roadmap?filter=${priorityActivity.filter}&lesson=${encodeURIComponent(priorityActivity.lessonId)}&content=${encodeURIComponent(priorityActivity.id)}`,
      }
    : nextContent
      ? {
          title: nextContent.contentTitle,
          detail: `${nextContent.lessonName} · Continue from your next pending item.`,
          href: `/learn/courses/${deliveryId}/roadmap?filter=${nextContent.contentType === "RESOURCE" ? "resources" : nextContent.contentType === "LIVE_CLASS" ? "live-sessions" : "lectures"}&lesson=${encodeURIComponent(nextContent.lessonId)}&content=${encodeURIComponent(nextContent.contentId)}`,
        }
      : next
      ? {
          title: next.title,
          detail: `${next.lessonName} · Continue from your next pending item.`,
          href: `/learn/courses/${deliveryId}/roadmap?filter=${nextFilter(workspace)}&lesson=${encodeURIComponent(next.lessonId)}&content=${encodeURIComponent(next.itemId)}`,
        }
      : null;

  const unifiedUpdates = [
    ...courseUpdates.slice(0,2).map((update) => ({
      key: `discussion-${update.id}`,
      title: update.pinned ? "Pinned update" : "Course update",
      detail: `${update.senderName} · ${formatWhen(update.createdAt) ?? ""}`,
      body: update.messageText,
      href: `/learn/courses/${deliveryId}/discussions`,
      priority: update.pinned ? 0 : 1,
      time: update.createdAt.getTime(),
    })),
    ...recentLearnerActivity.map((item) => ({
      key:`recent-${item.label}-${item.id}`,
      title:item.title,
      detail:`${item.label} · ${formatWhen(item.when)??""}`,
      body:null,
      href:`/learn/courses/${deliveryId}/roadmap?filter=${item.filter}&lesson=${encodeURIComponent(item.lessonId)}&content=${encodeURIComponent(item.id)}`,
      priority:2,
      time:item.when.getTime(),
    })),
    ...activity.slice(0,2).map((item) => ({
      key: `activity-${item.type}-${item.id}`,
      title: item.title,
      detail: `${item.type}${item.when ? ` · ${formatWhen(item.when)}` : ""}`,
      body: null,
      href: `/learn/courses/${deliveryId}/roadmap?filter=${item.filter}&lesson=${encodeURIComponent(item.lessonId)}&content=${encodeURIComponent(item.id)}`,
      priority: 3,
      time: item.when?.getTime() ?? Number.MAX_SAFE_INTEGER,
    })),
  ]
    .sort((left, right) =>
      left.priority !== right.priority
        ? left.priority - right.priority
        : left.priority < 3
          ? right.time - left.time
          : left.time - right.time,
    )
    .slice(0, 6);

  const homeCompletion = learnerCourseHomeCompletion({
    itemsTotal:summary.itemsTotal,itemsCompleted:summary.itemsCompleted,itemsMissed:summary.itemsMissed,readOnly,
    hasNextAction:Boolean(nextAction),
    hasPublishedPath:workspace.learningPath!==null,
  });
  const jumpLinks=learnerCourseOverviewJumps({
    hasPublishedPath:pathPreview.totalLessons>0,
    hasUpdates:unifiedUpdates.length>0,
  });
  return (
    <div className="space-y-5">
      <nav aria-label="Course overview sections"
        className="sticky top-16 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-lg border border-border bg-surface p-2 shadow-sm sm:hidden">
        {jumpLinks.map(item=>(
          <a key={item.id} href={"#"+item.id}
            className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-border px-3 text-xs font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-primary">
            {item.label}
          </a>
        ))}
      </nav>
      <div>
        <h2 className="sr-only">Overview</h2>
        <p className="m-0 text-sm text-body">
          See progress, next steps, and updates for this course at a glance.
        </p>
      </div>

      {(aboutSource.hasDescription||meta.credits!==null||meta.instructors.length>0)?<section id="course-overview-about" className="scroll-mt-32 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <h3 className="m-0 text-lg font-semibold text-foreground">
              About this course
            </h3>
            <p className="mt-1 text-xs text-muted-foreground" role="note">
              {aboutSource.label}
            </p>
            {meta.introductionText?.trim() ? (
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {meta.introductionText}
              </p>
            ) : null}
            <ExpandableCourseDescription
              safeBodyHtml={meta.bodyHtml}
              fallbackDescription={
                meta.courseDescription?.trim() ||
                workspace.learningPath?.description?.trim() ||
                "Course description has not been added yet."
              }
              secondaryDescription={
                !meta.bodyHtml &&
                workspace.learningPath?.description?.trim() &&
                workspace.learningPath.description.trim() !== meta.courseDescription?.trim()
                  ? workspace.learningPath.description
                  : null
              }
            />
            {learningTakeaways.length > 0 ? (
              <div className="mt-4">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  What you&apos;ll learn
                </p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {learningTakeaways.map((takeaway) => (
                    <li
                      key={takeaway}
                      className="flex items-start gap-2 text-sm text-body"
                    >
                      <span aria-hidden="true" className="mt-0.5 text-primary-text">
                        ✓
                      </span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="flex max-w-md flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-body">
              {workspace.course.code}
            </span>
            {meta.credits !== null ? (
              <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-body">
                {meta.credits} Credits
              </span>
            ) : null}
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-body">
              {meta.sectionName}
            </span>
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-body">
              {meta.academicPeriodName}
            </span>
            {meta.instructors.length===0 ? (
              <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-body">
                Faculty not recorded
              </span>
            ) : null}
            {meta.instructors.map((instructor) => (
              <span
                key={instructor.membershipId}
                className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-body"
              >
                {instructor.name}
                {instructor.role === "PRIMARY"
                  ? " · Faculty"
                  : ` · ${instructor.role.replaceAll("_", " ")}`}
              </span>
            ))}
            {String(meta.offeringType).toUpperCase() === "ELECTIVE" ? (
              <StatusBadge tone="info">Elective</StatusBadge>
            ) : null}
          </div>
        </div>
      </section>:null}

      <section id="course-overview-path" aria-label="Learning path preview" className="scroll-mt-32 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Learning path preview</h3>
            <p className="mt-1 text-sm text-body">
              {pathPreview.totalLessons} published {pathPreview.totalLessons===1?"lesson":"lessons"} in sequence.
              Lesson names describe the curriculum, not promises of learning outcomes.
            </p>
          </div>
          <Link href={`/learn/courses/${deliveryId}/roadmap`}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
            Full learning path →
          </Link>
        </div>
        {pathPreview.lessons.length ? (
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {pathPreview.lessons.map((lesson)=>(
              <li key={lesson.id} className="rounded-lg border border-border p-3">
                <Link href={`/learn/courses/${deliveryId}/roadmap?lesson=${encodeURIComponent(lesson.id)}`}
                  className="block text-sm font-semibold text-primary-text">{lesson.name}</Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lesson.progress===null?"No published trackable items"
                    : `${lesson.completed} of ${lesson.total} items completed · ${lesson.progress}%`}
                </p>
              </li>
            ))}
          </ol>
        ) : <p role="status" className="mt-4 text-sm text-body">
          A published lesson outline is not available yet.
        </p>}
        {pathPreview.remaining>0?<p className="mt-3 text-xs text-muted-foreground">
          And {pathPreview.remaining} more lessons in the learning path.
        </p>:null}
      </section>

      <section id="course-overview-next"
        className="scroll-mt-32 rounded-xl border border-primary bg-primary-subtle p-4 sm:p-5"
        aria-label="Next action"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-primary-text">
              {learnerCourseHomeActionLabel({
                readOnly,priorityType:priorityActivity?.type ?? null,
                overdue:Boolean(priorityActivity && "overdue" in priorityActivity && priorityActivity.overdue),
                hasNext:Boolean(nextAction),hasTrackable:summary.itemsTotal>0,
                hasIncomplete:summary.itemsCompleted<summary.itemsTotal,
                hasMissed:summary.itemsMissed>0,
              })}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              {nextAction
                ? nextAction.title
                : homeCompletion.title}
            </h3>
            <p className="mt-1 text-sm text-body">
              {nextAction
                ? nextAction.detail
                : homeCompletion.detail}
            </p>
          </div>
          <Link
            href={nextAction?.href ?? `/learn/courses/${deliveryId}/roadmap`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            {readOnly
              ? "View Learning Path"
              : priorityActivity
                ? priorityActivity.type === "Live Session" ? "View session" : "Open task"
                : nextAction
                  ? "Continue"
                   : "Start learning"}
          </Link>
        </div>
      </section>

      {!progressAvailability.hasDenominator ? (
        <section role="status" aria-label="Course progress availability"
          className="rounded-xl border border-warning bg-surface px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-foreground">Course progress not yet measurable</h3>
          <p className="mt-1 text-sm text-body">{progressAvailability.detail}</p>
        </section>
      ) : null}

      <div id="course-overview-progress" aria-label="Course progress summary" className="scroll-mt-32 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Overall"
          value={progressAvailability.hasDenominator ? `${summary.overallPercent}%` : "Not available"}
          detail={`${summary.itemsCompleted} of ${summary.itemsTotal} learning items complete.`}
        />
        <Metric
          label="Lessons"
          value={`${summary.lessonsCompleted}/${summary.lessonsTotal}`}
          detail="Completed lessons."
        />
        <Metric
          label="Assignments"
          value={`${summary.assignmentsCompleted}/${summary.assignmentsTotal}`}
          detail="Submitted assignments."
        />
        <Metric
          label="Quizzes"
          value={`${summary.quizzesCompleted}/${summary.quizzesTotal}`}
          detail="Completed quizzes."
        />
      </div>

      {unifiedUpdates.length > 0 ? (
        <section id="course-overview-updates" className="scroll-mt-32 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-semibold text-foreground">
                Recent updates
              </h3>
              <p className="mt-1 text-xs text-body">
                Course-team messages, saved completions, upcoming assessments, and live sessions.
              </p>
            </div>
            <Link
              href={`/learn/courses/${deliveryId}/roadmap`}
              className="text-sm font-semibold text-primary-text hover:text-primary-hover"
            >
              Learning Path
            </Link>
          </div>
          <nav aria-label="Recent course update categories" className="mt-4 flex flex-wrap gap-2">
            <Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+"/roadmap?filter=assessments"}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Assessments</Link>
            <Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+"/discussions"}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Discussions</Link>
            <Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+"/roadmap?filter=live-sessions"}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Live Sessions</Link>
          </nav>
          <div className="mt-4 divide-y divide-border">
            {unifiedUpdates.map((update) => (
              <article key={update.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link href={update.href} className="block truncate text-sm font-semibold text-foreground hover:text-primary-text">
                      {update.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{update.detail}</p>
                    {update.body ? <ExpandableCourseUpdate body={update.body} /> : null}
                  </div>
                  <Link href={update.href} aria-label={`Open ${update.title}`} className="shrink-0 text-primary-text">
                    →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
