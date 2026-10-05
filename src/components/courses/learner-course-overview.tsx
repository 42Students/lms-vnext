import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";

type Workspace = Awaited<ReturnType<typeof getLearnerCourseWorkspace>>;

type CourseMeta = {
  courseDescription: string | null;
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
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
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
  const next = workspace.nextItem;
  const now = Date.now();
  const activityCutoff = now + 14 * 24 * 60 * 60 * 1000;

  const learningTakeaways = workspace.lessons
    .slice(0, 6)
    .map((lesson) => lesson.name)
    .filter(Boolean);

  const activity = workspace.lessons
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
          type: "Assignment",
          when: item.dueAt,
          filter: "assessments",
          priority: item.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
        })),
      ...lesson.quizzes
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
          type: "Quiz",
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
          type: "Live Session",
          when: item.startsAt,
          filter: "live-sessions",
          priority: item.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
        })),
    ])
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 6);

  const priorityActivity = activity[0] ?? null;
  const nextAction = priorityActivity
    ? {
        title: priorityActivity.title,
        detail: `${priorityActivity.type}${priorityActivity.when ? ` · ${formatWhen(priorityActivity.when)}` : ""}`,
        href: `/learn/courses/${deliveryId}/roadmap?filter=${priorityActivity.filter}&lesson=${encodeURIComponent(priorityActivity.lessonId)}&content=${encodeURIComponent(priorityActivity.id)}`,
      }
    : next
      ? {
          title: next.title,
          detail: `${next.lessonName} · Continue from your next pending item.`,
          href: `/learn/courses/${deliveryId}/roadmap?filter=${nextFilter(workspace)}&lesson=${encodeURIComponent(next.lessonId)}&content=${encodeURIComponent(next.itemId)}`,
        }
      : null;

  const unifiedUpdates = [
    ...courseUpdates.map((update) => ({
      key: `discussion-${update.id}`,
      title: update.pinned ? "Pinned update" : "Course update",
      detail: `${update.senderName} · ${formatWhen(update.createdAt) ?? ""}`,
      body: update.messageText,
      href: `/learn/courses/${deliveryId}/discussions`,
      priority: update.pinned ? 0 : 1,
      time: update.createdAt.getTime(),
    })),
    ...activity.map((item) => ({
      key: `activity-${item.type}-${item.id}`,
      title: item.title,
      detail: `${item.type}${item.when ? ` · ${formatWhen(item.when)}` : ""}`,
      body: null,
      href: `/learn/courses/${deliveryId}/roadmap?filter=${item.filter}&lesson=${encodeURIComponent(item.lessonId)}&content=${encodeURIComponent(item.id)}`,
      priority: 2,
      time: item.when?.getTime() ?? Number.MAX_SAFE_INTEGER,
    })),
  ]
    .sort((left, right) =>
      left.priority !== right.priority
        ? left.priority - right.priority
        : left.priority < 2
          ? right.time - left.time
          : left.time - right.time,
    )
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="sr-only">Overview</h2>
        <p className="m-0 text-sm text-body">
          See progress, next steps, and updates for this course at a glance.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <h3 className="m-0 text-lg font-semibold text-foreground">
              About this course
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
              {meta.courseDescription?.trim() ||
                workspace.learningPath?.description?.trim() ||
                "Course description has not been added yet."}
            </p>
            {workspace.learningPath?.description?.trim() &&
            workspace.learningPath.description.trim() !== meta.courseDescription?.trim() ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
                {workspace.learningPath.description}
              </p>
            ) : null}
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
            {meta.credits ? (
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
      </section>

      <section
        className="rounded-xl border border-primary bg-primary-subtle p-5"
        aria-label="Next action"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-primary-text">
              {nextAction ? "Next up" : summary.itemsTotal > 0 ? "All clear" : "Start here"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              {nextAction
                ? nextAction.title
                : summary.itemsTotal > 0
                  ? "Course work complete"
                  : "Open the learning path"}
            </h3>
            <p className="mt-1 text-sm text-body">
              {nextAction
                ? nextAction.detail
                : summary.itemsTotal > 0
                  ? "You have completed every currently actionable item."
                  : "Your course workspace is ready. Start with the first published lesson."}
            </p>
          </div>
          <Link
            href={nextAction?.href ?? `/learn/courses/${deliveryId}/roadmap`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            {readOnly
              ? "View Learning Path"
              : nextAction
                ? "Continue"
                : "Open Learning Path"}
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Overall"
          value={`${summary.overallPercent}%`}
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
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-semibold text-foreground">
                Recent updates
              </h3>
              <p className="mt-1 text-xs text-body">
                Course-team messages, upcoming assessments, and live sessions.
              </p>
            </div>
            <Link
              href={`/learn/courses/${deliveryId}/roadmap`}
              className="text-sm font-semibold text-primary-text hover:text-primary-hover"
            >
              Learning Path
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {unifiedUpdates.map((update) => (
              <Link
                key={update.key}
                href={update.href}
                className="block py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-foreground">
                      {update.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {update.detail}
                    </p>
                    {update.body ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-body">
                        {update.body}
                      </p>
                    ) : null}
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-primary-text">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
