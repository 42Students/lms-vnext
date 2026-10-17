import { StatusBadge } from "@/components/ui/status-badge";
import { summarizeCollegeCourseContents } from "@/modules/courses/college-course-contents-summary-model";
import type {
  getAdminOfferingLearningWorkspace,
} from "@/modules/courses/admin-offering-learning-workspace";
import { FacultyLessonAuthoring } from "./faculty-lesson-authoring";
import { CollegeLessonReorderActions } from "./college-lesson-reorder-actions";
import {CollegeLessonDragOrder} from "./college-lesson-drag-order";
import {CollegeLessonVisibilityControl} from "./college-lesson-visibility-controls";
import { FacultyItemActions } from "./faculty-item-actions";
import {
  AdminQuizResultsActions,
  CreateLearningPathPanel,
  CreateLessonForm,
  LearningPathActions,
  LessonActions,
} from "./admin-learning-structure-actions";

type Workspace = Awaited<
  ReturnType<
    typeof getAdminOfferingLearningWorkspace
  >
>;

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "DRAFT":
      return "warning" as const;
    case "CLOSED":
    case "ARCHIVED":
      return "neutral" as const;
    default:
      return "info" as const;
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

function ContentCard({
  item,
}: {
  item: Workspace["lessons"][number]["contents"][number];
}) {
  const actions = [
    ...(item.status === "DRAFT"
      ? (["PUBLISH"] as const)
      : []),
    ...(item.status !== "ARCHIVED"
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info">
              {item.contentType.replaceAll(
                "_",
                " ",
              )}
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              Shared Offering
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          #{item.sequence + 1}
        </span>
      </div>

      {item.notes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {item.notes}
        </p>
      ) : null}

      {item.externalUrl ? (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
        >
          Open link ↗
        </a>
      ) : null}

      {item.contentType === "LIVE_CLASS" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {formatDateTime(item.startsAt)} →{" "}
          {formatDateTime(item.endsAt)}
        </p>
      ) : null}

      <FacultyItemActions
        transitionUrl={
          "/api/courses/lesson-contents/" +
          item.id +
          "/transition"
        }
        actions={actions}
      />
    </article>
  );
}

function AssignmentCard({
  item,
}: {
  item: Workspace["lessons"][number]["assignments"][number];
}) {
  const actions = [
    ...(item.status === "DRAFT"
      ? (["PUBLISH"] as const)
      : []),
    ...(item.status !== "ARCHIVED"
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="warning">
              Assignment
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              Shared Offering
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.maxPoints} points
        </span>
      </div>

      {item.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {item.description}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        {item.dueAt
          ? "Due " +
            formatDateTime(item.dueAt)
          : "No deadline"}
      </p>

      <FacultyItemActions
        transitionUrl={
          "/api/courses/assignments/" +
          item.id +
          "/transition"
        }
        actions={actions}
      />
    </article>
  );
}

function QuizCard({
  item,
}: {
  item: Workspace["lessons"][number]["quizzes"][number];
}) {
  const actions = [
    ...(item.status === "DRAFT"
      ? (["PUBLISH"] as const)
      : []),
    ...(item.status === "PUBLISHED"
      ? (["CLOSE"] as const)
      : []),
    ...(item.status !== "ARCHIVED"
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info">
              Quiz
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              Shared Offering
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.totalPoints} points
        </span>
      </div>

      {item.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {item.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span>
          {item.maxAttempts} attempt
          {item.maxAttempts === 1 ? "" : "s"}
        </span>
        <span>
          {item.dueAt
            ? "Due " +
              formatDateTime(item.dueAt)
            : "No deadline"}
        </span>
        <span>
          {item.resultsPublished
            ? "Results published"
            : "Results hidden"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <FacultyItemActions
          transitionUrl={
            "/api/courses/quizzes/" +
            item.id +
            "/transition"
          }
          actions={actions}
        />
        <AdminQuizResultsActions
          quizId={item.id}
          status={item.status}
          resultsPublished={
            item.resultsPublished
          }
        />
      </div>
    </article>
  );
}

export function AdminOfferingLearningOverview({
  workspace,
}: {
  workspace: Workspace;
}) {
  const { offering, learningPath } =
    workspace;

  if (!learningPath) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info">
              {offering.type}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {offering.cohortName}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {offering.academicPeriodName}
            </StatusBadge>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-foreground">
            Shared learning structure
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            No active Learning Path exists for
            this Offering yet. Create one before
            adding Lessons or shared learning
            items.
          </p>
        </section>
        <CreateLearningPathPanel
          offeringId={offering.id}
          defaultTitle={
            offering.courseName +
            " Learning Path"
          }
        />
      </div>
    );
  }

  const nextLessonSequence =
    workspace.lessons.reduce(
      (max, lesson) =>
        Math.max(
          max,
          lesson.sequence + 1,
        ),
      0,
    );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="info">
                {offering.type}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {offering.cohortName}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {offering.academicPeriodName}
              </StatusBadge>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              Shared Learning Path
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {learningPath.title}
            </h2>
            {learningPath.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-body">
                {learningPath.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              tone={statusTone(
                learningPath.status,
              )}
            >
              {learningPath.status}
            </StatusBadge>
            <LearningPathActions
              learningPath={learningPath}
            />
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-[var(--lms-neutral-50)] px-3 py-2 text-xs leading-5 text-muted-foreground">
          Items created here are shared across
          every active Section Delivery in this
          Offering. Faculty can add separate
          Section-specific items from their
          Teaching Course workspace.
        </div>
      </section>

      <section aria-label="In this course" className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">In this course</h2>
        <p className="mt-1 text-sm text-muted-foreground">Recorded shared learning items only. Visibility and publication are separate controls.</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {summarizeCollegeCourseContents(workspace.lessons).map(item=>(
            <div key={item.key} className="min-w-0 rounded-lg border border-border p-3">
              <dt className="break-words text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{item.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CreateLessonForm
        learningPathId={learningPath.id}
        nextSequence={nextLessonSequence}
      />

      {workspace.lessons.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border bg-surface p-6">
          <h3 className="m-0 text-base font-semibold text-foreground">
            No Lessons yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the first Lesson to begin building
            the shared Course structure.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          <CollegeLessonDragOrder learningPathId={learningPath.id}
            lessons={workspace.lessons.map(row=>({id:row.id,name:row.name,sequence:row.sequence}))}/>
          {workspace.lessons.map(
            (lesson, lessonIndex) => {
              const itemCount =
                lesson.contents.length +
                lesson.assignments.length +
                lesson.quizzes.length;

              return (
                <section
                  key={lesson.id}
                  className="rounded-xl border border-border bg-[var(--lms-neutral-50)] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
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
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {itemCount} items
                      </span>
                      <CollegeLessonReorderActions
                        learningPathId={learningPath.id}
                        lessonId={lesson.id}
                        expectedSequence={lesson.sequence}
                        canMoveUp={lessonIndex > 0}
                        canMoveDown={lessonIndex < workspace.lessons.length - 1}
                      />
                      <CollegeLessonVisibilityControl lesson={{
                        id:lesson.id,name:lesson.name,visibleToStudents:lesson.visibleToStudents,
                        updatedAt:lesson.updatedAt.toISOString(),
                      }}/>
                      <LessonActions
                        lesson={lesson}
                      />
                    </div>
                  </div>

                  <FacultyLessonAuthoring
                    lessonId={lesson.id}
                    deliveryId={null}
                    audience="OFFERING"
                    nextContentSequence={
                      lesson.nextContentSequence
                    }
                    nextAssignmentSequence={
                      lesson.nextAssignmentSequence
                    }
                    nextQuizSequence={
                      lesson.nextQuizSequence
                    }
                  />

                  {itemCount === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">
                      No shared learning items in
                      this Lesson yet.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {lesson.contents.map(
                        (item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                          />
                        ),
                      )}
                      {lesson.assignments.map(
                        (item) => (
                          <AssignmentCard
                            key={item.id}
                            item={item}
                          />
                        ),
                      )}
                      {lesson.quizzes.map(
                        (item) => (
                          <QuizCard
                            key={item.id}
                            item={item}
                          />
                        ),
                      )}
                    </div>
                  )}
                </section>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
