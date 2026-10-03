import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AssignmentSubmissionControl } from "./assignment-submission-control";
import { QuizAttemptControl } from "./quiz-attempt-control";
import { ResourceProgressControl } from "./resource-progress-control";
import {
  assignmentInteractionState,
  resourceInteractionState,
} from "./learner-interaction-model";
import {
  getLearnerCourseWorkspace,
} from "@/modules/courses/learner-course-service";

type Workspace = Awaited<
  ReturnType<
    typeof getLearnerCourseWorkspace
  >
>;

function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-body">
          {label}
        </span>
        <span className="text-xs font-bold text-foreground">
          {value}%
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function progressTone(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "IN_PROGRESS":
      return "info" as const;
    case "MISSED":
      return "error" as const;
    default:
      return "neutral" as const;
  }
}

function progressLabel(
  status: string,
) {
  switch (status) {
    case "NOT_STARTED":
      return "Not started";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    case "MISSED":
      return "Missed";
    default:
      return status;
  }
}

function formatDateTime(
  value: Date | string | null,
) {
  if (!value) return null;
  const date =
    value instanceof Date
      ? value
      : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function kindLabel(
  kind: "CONTENT" | "ASSIGNMENT" | "QUIZ",
) {
  switch (kind) {
    case "CONTENT":
      return "Learning content";
    case "ASSIGNMENT":
      return "Assignment";
    case "QUIZ":
      return "Quiz";
  }
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
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p>
    </section>
  );
}

function ContentCard({
  content,
  deliveryId,
}: {
  content: Workspace["lessons"][number]["contents"][number];
  deliveryId: string;
}) {
  const start = formatDateTime(content.startsAt);
  const end = formatDateTime(content.endsAt);
  const interaction = resourceInteractionState({
    type: content.type,
    externalUrl: content.externalUrl,
    progressStatus: content.progress.status,
  });

  return (
    <article
      id={`item-CONTENT-${content.id}`}
      className="scroll-mt-28 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">
              {content.type.replaceAll("_", " ")}
            </StatusBadge>
            <StatusBadge
              tone={progressTone(
                content.progress.status,
              )}
            >
              {progressLabel(
                content.progress.status,
              )}
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {content.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          #{content.sequence + 1}
        </span>
      </div>

      {content.notes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {content.notes}
        </p>
      ) : null}

      {content.progress.durationSeconds > 0 ? (
        <div className="mt-4">
          <ProgressBar
            value={
              content.progress.percentComplete
            }
            label="Playback progress"
          />
        </div>
      ) : null}

      {start || end ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {start ? `Starts ${start}` : ""}
          {start && end ? " · " : ""}
          {end ? `Ends ${end}` : ""}
        </p>
      ) : null}

      {content.externalUrl ? (
        <a
          href={content.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
        >
          Open content ↗
        </a>
      ) : content.storageKey ? (
        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Media is attached to this lesson and will open in the learner player when storage delivery is connected.
        </p>
      ) : null}

      {interaction.canMarkComplete ? (
        <ResourceProgressControl
          contentId={content.id}
          deliveryId={deliveryId}
        />
      ) : null}
    </article>
  );
}

function AssignmentCard({
  assignment,
  deliveryId,
}: {
  assignment: Workspace["lessons"][number]["assignments"][number];
  deliveryId: string;
}) {
  const interaction =
    assignmentInteractionState({
      submissionId: assignment.submissionId,
      progressStatus:
        assignment.progress.status,
    });

  return (
    <article
      id={`item-ASSIGNMENT-${assignment.id}`}
      className="scroll-mt-28 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="warning">
              Assignment
            </StatusBadge>
            <StatusBadge
              tone={progressTone(
                assignment.progress.status,
              )}
            >
              {progressLabel(
                assignment.progress.status,
              )}
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {assignment.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {assignment.maxPoints} points
        </span>
      </div>

      {assignment.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {assignment.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {assignment.dueAt ? (
          <span>
            Due {formatDateTime(assignment.dueAt)}
          </span>
        ) : (
          <span>No deadline</span>
        )}
        {assignment.submittedAt ? (
          <span>
            Submitted{" "}
            {formatDateTime(
              assignment.submittedAt,
            )}
          </span>
        ) : null}
      </div>

      {assignment.gradePublished ? (
        <div className="mt-4 rounded-lg bg-primary-subtle px-3 py-2 text-sm text-body">
          Published grade:{" "}
          <strong className="text-foreground">
            {assignment.pointsAwarded ?? 0}/
            {assignment.maxPoints}
          </strong>
          {assignment.feedback ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
              {assignment.feedback}
            </p>
          ) : null}
        </div>
      ) : assignment.submissionId ? (
        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Submitted. Grade is not published yet.
        </p>
      ) : assignment.progress.status ===
        "MISSED" ? (
        <p className="mt-4 text-xs font-semibold text-error">
          The submission window has closed.
        </p>
      ) : null}

      {interaction.canSubmit ? (
        <AssignmentSubmissionControl
          assignmentId={assignment.id}
          deliveryId={deliveryId}
        />
      ) : null}
    </article>
  );
}

function QuizCard({
  quiz,
  deliveryId,
}: {
  quiz: Workspace["lessons"][number]["quizzes"][number];
  deliveryId: string;
}) {
  return (
    <article
      id={`item-QUIZ-${quiz.id}`}
      className="scroll-mt-28 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">
              Quiz
            </StatusBadge>
            <StatusBadge
              tone={progressTone(
                quiz.progress.status,
              )}
            >
              {progressLabel(
                quiz.progress.status,
              )}
            </StatusBadge>
            {quiz.status === "CLOSED" ? (
              <StatusBadge tone="neutral">
                Closed
              </StatusBadge>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {quiz.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {quiz.totalPoints} points
        </span>
      </div>

      {quiz.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {quiz.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span>
          Attempts {quiz.attemptsUsed}/
          {quiz.maxAttempts}
        </span>
        {quiz.dueAt ? (
          <span>
            Due {formatDateTime(quiz.dueAt)}
          </span>
        ) : (
          <span>No deadline</span>
        )}
      </div>

      {quiz.progress.status === "MISSED" ? (
        <p className="mt-4 text-xs font-semibold text-error">
          This quiz is no longer available for an attempt.
        </p>
      ) : quiz.progress.status ===
        "COMPLETED" ? (
        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Attempt recorded
          {quiz.resultsPublished
            ? " · Results are published."
            : " · Results are not published yet."}
        </p>
      ) : null}

      <QuizAttemptControl
        quizId={quiz.id}
        deliveryId={deliveryId}
        status={quiz.status}
        attemptsUsed={quiz.attemptsUsed}
        attemptsRemaining={quiz.attemptsRemaining}
        resultsPublished={quiz.resultsPublished}
        progressStatus={quiz.progress.status}
      />
    </article>
  );
}

export function LearnerCourseWorkspace({
  deliveryId,
  workspace,
}: {
  deliveryId: string;
  workspace: Workspace;
}) {
  const summary = workspace.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner · Course"
        title={workspace.course.name}
        description={`${workspace.course.code} · Your exact Section learning workspace.`}
        actions={
          workspace.nextItem ? (
            <Link
              href={`/learn/courses/${deliveryId}#item-${workspace.nextItem.kind}-${workspace.nextItem.itemId}`}
              className="inline-flex min-h-11 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            >
              Continue learning
            </Link>
          ) : null
        }
      />

      {!workspace.learningPath ? (
        <EmptyState
          title="Learning path is being prepared"
          description="Your Course delivery is active, but its learning path has not been published yet."
        />
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  {workspace.learningPath.title}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {workspace.nextItem
                    ? `Next: ${workspace.nextItem.title}`
                    : summary.itemsMissed > 0
                      ? "No remaining actionable items"
                      : "Course work complete"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-body">
                  {workspace.learningPath.description ??
                    "Follow the ordered learning path below. Progress is calculated from content completion, assignment submissions and quiz attempts."}
                </p>
                {workspace.nextItem ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge tone="info">
                      {kindLabel(
                        workspace.nextItem.kind,
                      )}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground">
                      {workspace.nextItem.lessonName}
                    </span>
                  </div>
                ) : null}
              </div>
              <ProgressBar
                value={summary.overallPercent}
                label="Overall Course progress"
              />
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Overall"
              value={`${summary.overallPercent}%`}
              detail={`${summary.itemsCompleted} of ${summary.itemsTotal} learning items complete.`}
            />
            <Metric
              label="Lessons"
              value={`${summary.lessonsCompleted}/${summary.lessonsTotal}`}
              detail="Lessons complete only when every actionable item is complete."
            />
            <Metric
              label="Assessments"
              value={
                summary.assignmentsCompleted +
                summary.quizzesCompleted
              }
              detail={`${summary.assignmentsTotal} assignments · ${summary.quizzesTotal} quizzes.`}
            />
            <Metric
              label="Missed"
              value={summary.itemsMissed}
              detail="Expired or closed assessments remain visible but are skipped by Continue Learning."
            />
          </div>

          <div className="space-y-5">
            {workspace.lessons.map(
              (lesson, lessonIndex) => (
                <section
                  key={lesson.id}
                  className="rounded-xl border border-border bg-[var(--lms-neutral-50)] p-4 sm:p-5"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                        Lesson {lessonIndex + 1}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-foreground">
                        {lesson.name}
                      </h2>
                      {lesson.description ? (
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-body">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {lesson.items.length} items
                    </span>
                  </div>

                  {lesson.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">
                      No published learning items in this lesson yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lesson.items.map((item) => {
                        if (
                          item.kind === "CONTENT"
                        ) {
                          const content =
                            lesson.contents.find(
                              (candidate) =>
                                candidate.id ===
                                item.id,
                            );
                          return content ? (
                            <ContentCard
                              key={item.id}
                              content={content}
                              deliveryId={deliveryId}
                            />
                          ) : null;
                        }

                        if (
                          item.kind ===
                          "ASSIGNMENT"
                        ) {
                          const assignment =
                            lesson.assignments.find(
                              (candidate) =>
                                candidate.id ===
                                item.id,
                            );
                          return assignment ? (
                            <AssignmentCard
                              key={item.id}
                              assignment={assignment}
                              deliveryId={deliveryId}
                            />
                          ) : null;
                        }

                        const quiz =
                          lesson.quizzes.find(
                            (candidate) =>
                              candidate.id ===
                              item.id,
                          );
                        return quiz ? (
                          <QuizCard
                            key={item.id}
                            quiz={quiz}
                            deliveryId={deliveryId}
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                </section>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
