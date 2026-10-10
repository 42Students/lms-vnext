import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FacultyLessonAuthoring } from "./faculty-lesson-authoring";
import { FacultyItemActions } from "./faculty-item-actions";
import { FacultyAssignmentReview } from "./faculty-assignment-review";
import { FacultyQuizReview } from "./faculty-quiz-review";
import { FacultyAssessmentEditor } from "./faculty-assessment-editor";
import { FacultyQuizQuestionEditor } from "./faculty-quiz-question-editor";
import { FacultyCourseHomeSignals } from "./faculty-course-home-signals";
import { CourseDisplayReadOnly } from "./course-display-read-only";
import { FacultyContentOrderEditor } from "./faculty-content-order-editor";
import { lessonContentOrderRuntimeEnabled } from "@/modules/courses/lesson-content-order-readiness";
import type { CourseDisplayContentView } from "@/modules/courses/course-display-service";
import type { getFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-service";
import {
  facultyOwnedItemActions,
  nextLessonItemSequence,
} from "./faculty-course-operation-model";
import {
  getFacultyCourseWorkspace,
} from "@/modules/courses/faculty-course-service";

type Workspace = Awaited<
  ReturnType<
    typeof getFacultyCourseWorkspace
  >
>;

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "DRAFT":
      return "warning" as const;
    case "CLOSED":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function audienceLabel(
  deliveryId: string | null,
) {
  return deliveryId
    ? "This Section"
    : "Shared Offering";
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

function ContentItem({
  item,
}: {
  item: Workspace["lessons"][number]["contents"][number];
}) {
  const actions = facultyOwnedItemActions({
    deliveryId: item.deliveryId,
    status: item.status,
    kind: "CONTENT",
  });
  const available = [
    ...(actions.canPublish
      ? (["PUBLISH"] as const)
      : []),
    ...(actions.canArchive
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
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
              {audienceLabel(item.deliveryId)}
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
      {item.deliveryId ? (
        <FacultyItemActions
          transitionUrl={`/api/courses/lesson-contents/${item.id}/transition`}
          actions={available}
        />
      ) : null}
    </article>
  );
}

function AssignmentItem({
  item,
  deliveryId,
}: {
  item: Workspace["lessons"][number]["assignments"][number];
  deliveryId: string;
}) {
  const actions = facultyOwnedItemActions({
    deliveryId: item.deliveryId,
    status: item.status,
    kind: "ASSIGNMENT",
  });
  const available = [
    ...(actions.canPublish
      ? (["PUBLISH"] as const)
      : []),
    ...(actions.canArchive
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="warning">
              Assignment
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {audienceLabel(item.deliveryId)}
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
          ? `Due ${new Intl.DateTimeFormat(
              "en-IN",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            ).format(item.dueAt)}`
          : "No deadline"}
      </p>
      {item.deliveryId ? (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <FacultyAssessmentEditor
            assessment={{
              id: item.id,
              kind: "ASSIGNMENT",
              title: item.title,
              description: item.description,
              dueAt: item.dueAt,
              status: item.status,
              maxPoints: item.maxPoints,
            }}
          />
          <FacultyItemActions
            transitionUrl={`/api/courses/assignments/${item.id}/transition`}
            actions={available}
          />
        </div>
      ) : null}

      <FacultyAssignmentReview
        assignmentId={item.id}
        deliveryId={deliveryId}
        maxPoints={item.maxPoints}
        status={item.status}
      />
    </article>
  );
}

function QuizItem({
  item,
  deliveryId,
}: {
  item: Workspace["lessons"][number]["quizzes"][number];
  deliveryId: string;
}) {
  const actions = facultyOwnedItemActions({
    deliveryId: item.deliveryId,
    status: item.status,
    kind: "QUIZ",
  });
  const available = [
    ...(actions.canPublish
      ? (["PUBLISH"] as const)
      : []),
    ...(actions.canClose
      ? (["CLOSE"] as const)
      : []),
    ...(actions.canArchive
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">
              Quiz
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {audienceLabel(item.deliveryId)}
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
          {item.resultsPublished
            ? "Results published"
            : "Results hidden"}
        </span>
      </div>
      {item.deliveryId ? (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <FacultyAssessmentEditor
            assessment={{
              id: item.id,
              kind: "QUIZ",
              title: item.title,
              description: item.description,
              dueAt: item.dueAt,
              status: item.status,
              maxAttempts: item.maxAttempts,
            }}
          />
          {item.status === "DRAFT" ? (
            <FacultyQuizQuestionEditor
              quizId={item.id}
              deliveryId={deliveryId}
            />
          ) : null}
          <FacultyItemActions
            transitionUrl={`/api/courses/quizzes/${item.id}/transition`}
            actions={available}
          />
        </div>
      ) : null}

      <FacultyQuizReview
        quizId={item.id}
        deliveryId={deliveryId}
        status={item.status}
        resultsPublished={item.resultsPublished}
        deliveryOwned={item.deliveryId !== null}
      />
    </article>
  );
}

export function FacultyCourseWorkspace({
  workspace,
  homeSignals,
  display,
}: {
  workspace: Workspace;
  homeSignals: Awaited<
    ReturnType<typeof getFacultyCourseHomeSignals>
  >;
  display: CourseDisplayContentView | null;
}) {
  const { course, learningPath, summary } =
    workspace;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faculty · Course"
        title={course.courseName}
        description={`${course.courseCode} · ${course.sectionName} · ${course.academicPeriodName}`}
      />

      <FacultyCourseHomeSignals
        signals={homeSignals}
        deliveryId={course.deliveryId}
      />

      <CourseDisplayReadOnly
        introductionText={
          display?.introductionText ?? null
        }
        bodyHtml={display?.bodyHtml ?? null}
        takeaways={display?.takeaways ?? []}
        fallbackDescription={
          course.courseDescription
        }
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              Exact teaching assignment
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {course.sectionName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-body">
              Your active{" "}
              {course.teachingRole
                .replaceAll("_", " ")
                .toLowerCase()}{" "}
              assignment grants teaching access only
              to this Section delivery.
            </p>
          </div>
          <StatusBadge tone="info">
            {course.teachingRole.replaceAll(
              "_",
              " ",
            )}
          </StatusBadge>
        </div>
        <div className="mt-4 rounded-lg bg-[var(--lms-neutral-50)] px-3 py-2 text-xs leading-5 text-muted-foreground">
          Shared Offering items are visible here but
          remain structurally admin-owned. Items
          labeled “This Section” are the delivery
          scope used for faculty-authored content and
          assessments.
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Lessons"
          value={summary.lessons}
          detail="Active lessons in the current learning path."
        />
        <Metric
          label="Content"
          value={summary.contents}
          detail="Shared and Section-specific lesson content."
        />
        <Metric
          label="Assignments"
          value={summary.assignments}
          detail="Assignment definitions visible to this Section."
        />
        <Metric
          label="Quizzes"
          value={summary.quizzes}
          detail="Quiz definitions visible to this Section."
        />
        <Metric
          label="Draft items"
          value={summary.draftItems}
          detail={`${summary.publishedItems} published items are learner-visible when the path is published.`}
        />
      </div>

      {!learningPath ? (
        <EmptyState
          title="No current learning path"
          description="The Course Offering does not have an active learning path yet. Learning-path structure remains a College Admin / scoped Super Admin responsibility."
        />
      ) : (
        <>
          <section id="learning-path" className="scroll-mt-24 rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  Learning path
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {learningPath.title}
                </h2>
                {learningPath.description ? (
                  <p className="mt-2 text-sm leading-6 text-body">
                    {learningPath.description}
                  </p>
                ) : null}
              </div>
              <StatusBadge
                tone={statusTone(
                  learningPath.status,
                )}
              >
                {learningPath.status}
              </StatusBadge>
            </div>
          </section>

          {workspace.lessons.length === 0 ? (
            <EmptyState
              title="No lessons yet"
              description="The current learning path has no active lessons."
            />
          ) : (
            <div className="space-y-5">
              {workspace.lessons.map(
                (lesson, lessonIndex) => {
                  const itemCount =
                    lesson.contents.length +
                    lesson.assignments.length +
                    lesson.quizzes.length;
                  const nextSequence =
                    nextLessonItemSequence([
                      ...lesson.contents.map(
                        (item) => item.sequence,
                      ),
                      ...lesson.assignments.map(
                        (item) => item.sequence,
                      ),
                      ...lesson.quizzes.map(
                        (item) => item.sequence,
                      ),
                    ]);

                  return (
                    <section
                      key={lesson.id}
                      className="rounded-xl border border-border bg-[var(--lms-neutral-50)] p-4 sm:p-5"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                            Lesson{" "}
                            {lessonIndex + 1}
                          </p>
                          <h2 className="mt-1 text-lg font-semibold text-foreground">
                            {lesson.name}
                          </h2>
                          {lesson.description ? (
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-body">
                              {
                                lesson.description
                              }
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          {itemCount} items
                        </span>
                      </div>

                      <FacultyLessonAuthoring
                        lessonId={lesson.id}
                        deliveryId={course.deliveryId}
                        nextContentSequence={
                          nextSequence
                        }
                        nextAssignmentSequence={
                          nextSequence
                        }
                        nextQuizSequence={
                          nextSequence
                        }
                      />

                      <FacultyContentOrderEditor
                        lessonId={lesson.id}
                        deliveryId={course.deliveryId}
                        enabled={lessonContentOrderRuntimeEnabled()}
                        items={lesson.contents.map(
                          (item) => ({
                            id: item.id,
                            title: item.title,
                          }),
                        )}
                      />

                      {itemCount === 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">
                          No active content or
                          assessments in this lesson.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {lesson.contents.map(
                            (item) => (
                              <ContentItem
                                key={item.id}
                                item={item}
                              />
                            ),
                          )}
                          {lesson.assignments.map(
                            (item) => (
                              <AssignmentItem
                                key={item.id}
                                item={item}
                                deliveryId={course.deliveryId}
                              />
                            ),
                          )}
                          {lesson.quizzes.map(
                            (item) => (
                              <QuizItem
                                key={item.id}
                                item={item}
                                deliveryId={course.deliveryId}
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
        </>
      )}
    </div>
  );
}
