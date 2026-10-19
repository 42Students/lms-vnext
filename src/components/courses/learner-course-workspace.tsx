import { Badge } from "@/components/ui/badge";
import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
import {learnerAssessmentSubmittedLinkHref} from "@/modules/courses/learner-assessment-submitted-link-model";
import {learnerRoadmapHeadline} from "@/modules/courses/learner-roadmap-headline-model";
import {learnerRoadmapFilterRecoveryNotice} from "@/modules/courses/learner-roadmap-filter-recovery-model";
import { learnerRoadmapEmptyState } from "@/modules/courses/learner-roadmap-empty-state-model";
import { resolveLearnerRoadmapFocusFilter } from "@/modules/courses/learner-roadmap-focus-filter-model";
import { learnerRoadmapDialogKey } from "@/modules/courses/learner-roadmap-dialog-key-model";
import { learnerRoadmapShouldOpenItem } from "@/modules/courses/learner-roadmap-item-focus-model";
import { LearnerRoadmapItemDialog } from "./learner-roadmap-item-dialog";
import { learnerSafeExternalContentHref } from "@/modules/courses/learner-external-content-link-model";
import {LearnerLiveClassLink} from "./learner-live-class-link";
import { assignmentFilesRuntimeEnabled,multipartAssignmentRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { formatLearnerCourseMoment } from "@/modules/courses/learner-course-date-model";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { AssignmentFileOpenControl } from "./assignment-file-open-control";
import {AssignmentSubmissionLinks} from "./assignment-submission-links";
import { AssignmentSubmissionControl } from "./assignment-submission-control";
import { QuizAttemptControl } from "./quiz-attempt-control";
import { ResourceProgressControl } from "./resource-progress-control";
import {LearnerLiveSessionStatus} from "./learner-live-session-status";
import {LessonResourceMaterialsControl} from "./lesson-resource-materials-control";
import {resourceMaterialsRuntimeEnabled} from "@/modules/courses/resource-material-readiness";
import { LearnerYouTubePlayer } from "./learner-youtube-player";
import { LearnerVideoPlayer } from "./learner-video-player";
import {LearnerCourseStateRetry} from "./learner-course-state-retry";
import {LearnerFormattedResponse} from "./learner-formatted-response";
import {
  assignmentInteractionState,
  isAssignmentOverdue,
  isQuizExpired,
  lessonProgressState,
  resourceInteractionState,
} from "./learner-interaction-model";
import {
  getLearnerCourseWorkspace,
} from "@/modules/courses/learner-course-service";
import { learnerRoadmapMeasuredProgress } from "@/modules/courses/learner-roadmap-progress-availability-model";
import {learnerRoadmapMobileOutline} from "@/modules/courses/learner-roadmap-mobile-model";

type Workspace = Awaited<
  ReturnType<
    typeof getLearnerCourseWorkspace
  >
>;

function ProgressBar({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  if (value === null) {
    return <p role="status" className="text-sm text-muted-foreground">
      Progress is not measured until this Learning Path has trackable items.
    </p>;
  }
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

function formatDateTime(value: Date | string | null) {
  return formatLearnerCourseMoment(value);
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
  lessonId,
  deliveryId,
  readOnly,
  materialsEnabled,
  saveIntervalMs,
}: {
  content: Workspace["lessons"][number]["contents"][number];
  lessonId: string;
  deliveryId: string;
  readOnly: boolean;
  materialsEnabled:boolean;
  saveIntervalMs:number;
}) {
  const start = formatDateTime(content.startsAt);
  const end = formatDateTime(content.endsAt);
  const interaction = resourceInteractionState({
    type: content.type,
    externalUrl: content.externalUrl,
    storageKey: content.storageKey,
    progressStatus: content.progress.status,
  });
  const scheduled = content.availability === "SCHEDULED";
  const ended = content.availability === "ENDED";

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
            {(content.type === "VIDEO" || content.type === "YOUTUBE") &&
            content.progress.percentComplete > 0 &&
            content.progress.percentComplete < 100 ? (
              <StatusBadge tone="info">
                {content.progress.percentComplete}% watched
              </StatusBadge>
            ) : null}
            {scheduled ? (
              <StatusBadge tone="warning">
                Scheduled
              </StatusBadge>
            ) : ended ? (
              <StatusBadge tone="neutral">
                Ended
              </StatusBadge>
            ) : null}
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

      {(content.type==="VIDEO"||content.type==="YOUTUBE") && content.progress.durationSeconds>0
        ? <p className="mt-2 text-xs font-semibold text-body">
            {content.progress.percentComplete}% watched
          </p>:null}
      {content.type==="LIVE_CLASS"&&content.startsAt&&content.endsAt
        ? <LearnerLiveSessionStatus startsAt={new Date(content.startsAt).toISOString()}
            endsAt={new Date(content.endsAt).toISOString()}/>:null}
      {content.type==="LIVE_CLASS"&&!learnerSafeExternalContentHref(content.externalUrl)
        ? <p role="status" className="mt-2 text-xs text-muted-foreground">
            No meeting link available yet. Check back before the session starts.
          </p>:null}
      {start || end ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {start ? `Starts ${start}` : ""}
          {start && end ? " · " : ""}
          {end ? `Ends ${end}` : ""}
        </p>
      ) : null}

      {scheduled ? (
        <div className="mt-4 rounded-lg border border-border bg-surface-subtle px-3 py-3 text-sm text-body">
          {content.type==="LIVE_CLASS"
            ? start
              ? "Live session starts "+start+". Join and Copy are available now when the meeting link is published."
              : "Live session scheduled. Join and Copy are available once the meeting link is published."
            : start
              ? `Available ${start}`
              : "This item is scheduled and is not available yet."}
        {content.type==="LIVE_CLASS"&&learnerSafeExternalContentHref(content.externalUrl)?<LearnerLiveClassLink href={learnerSafeExternalContentHref(content.externalUrl)!} endsAt={content.endsAt?new Date(content.endsAt).toISOString():null}/>:null}
         </div>
      ) : content.type === "LIVE_CLASS" && ended ? (
        <div className="mt-4 rounded-lg border border-border bg-surface-subtle px-3 py-3 text-sm text-body">
          This live session has ended.
        </div>
      ) : content.type === "VIDEO" &&
      content.storageKey ? (
        <LearnerVideoPlayer
          lessonId={lessonId}
          storageKey={content.storageKey}
          contentId={content.id}
          deliveryId={deliveryId}
          initialPositionSeconds={
            content.progress.lastPositionSeconds
          }
          authoredDurationSeconds={
            content.progress.durationSeconds
          }
          completed={
            content.progress.status ===
            "COMPLETED"
          }
          readOnly={readOnly}
          saveIntervalMs={saveIntervalMs}
        />
      ) : content.type === "YOUTUBE" &&
      content.externalUrl ? (
        <LearnerYouTubePlayer
          contentId={content.id}
          deliveryId={deliveryId}
          externalUrl={content.externalUrl}
          initialPositionSeconds={
            content.progress
              .lastPositionSeconds
          }
          authoredDurationSeconds={
            content.progress
              .durationSeconds
          }
          completed={
            content.progress.status ===
            "COMPLETED"
          }
          readOnly={readOnly}
          saveIntervalMs={saveIntervalMs}
        />
      ) : content.type==="LIVE_CLASS"&&learnerSafeExternalContentHref(content.externalUrl)?(
         <LearnerLiveClassLink href={learnerSafeExternalContentHref(content.externalUrl)!} endsAt={content.endsAt?new Date(content.endsAt).toISOString():null}/>
       ) : learnerSafeExternalContentHref(content.externalUrl) ? (
        <div className="mt-4"><ThirdPartyLink
          href={learnerSafeExternalContentHref(content.externalUrl)!}
          label={content.type === "LIVE_CLASS"
            ? "Join live class ↗"
            : content.type === "RESOURCE"
              ? "Open resource ↗"
              : "Open content ↗"} /></div>
      ) : content.externalUrl ? (
        <p role="status" className="mt-4 text-xs font-semibold text-warning">
          The authored external link is unavailable or unsafe to open.
        </p>
      ) : content.type === "RESOURCE" &&
      content.storageKey ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/courses/deliveries/${encodeURIComponent(deliveryId)}/contents/${encodeURIComponent(content.id)}/file`}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Open resource ↗
          </a>
          <a
            href={`/api/courses/deliveries/${encodeURIComponent(deliveryId)}/contents/${encodeURIComponent(content.id)}/file?download=1`}
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Download
          </a>
        </div>
      ) : content.storageKey ? (
        <p className="mt-4 text-xs font-semibold text-warning">
          This file type is not supported in the learner viewer yet.
        </p>
      ) : null}

      {content.type==="RESOURCE"&&materialsEnabled&&!scheduled?<LessonResourceMaterialsControl
        contentId={content.id} deliveryId={deliveryId} editable={false}/>:null}
      {!readOnly &&
      interaction.canMarkComplete ? (
        <ResourceProgressControl
          contentId={content.id}
          deliveryId={deliveryId}
          contentType={content.type === "LIVE_CLASS" ? "LIVE_CLASS" : "RESOURCE"}
        />
      ) : null}
    </article>
  );
}

function AssignmentCard({
  assignment,
  deliveryId,
  readOnly,
}: {
  assignment: Workspace["lessons"][number]["assignments"][number];
  deliveryId: string;
  readOnly: boolean;
}) {
  const interaction =
    assignmentInteractionState({
      submissionId: assignment.submissionId,
      progressStatus:
        assignment.progress.status,
    });
  const overdue = isAssignmentOverdue(
    assignment.submissionId,
    assignment.dueAt,
  );
  // Legacy: missing or expired due dates never enable the submission control.
  // eslint-disable-next-line react-hooks/purity -- submission closes at request time.
  const submissionClosed=!assignment.dueAt||assignment.dueAt.getTime()<=Date.now();

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
              tone={
                overdue
                  ? "warning"
                  : progressTone(
                      assignment.progress.status,
                    )
              }
            >
              {overdue
                ? "Overdue"
                : progressLabel(
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
            {overdue ? "Was due" : "Due"} {formatDateTime(assignment.dueAt)}
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

      {assignment.submissionId && assignment.submissionType==="TEXT"?
        <section aria-label="Your submission" className="mt-4 rounded-lg bg-surface-subtle p-3">
          <h4 className="text-sm font-semibold text-foreground">Your submission</h4>
          <LearnerFormattedResponse text={assignment.submissionText??"No text was saved."}/>
        </section>:null}
      {assignment.submissionId && assignment.submissionType==="LINK"?
        <section aria-label="Your submission" className="mt-4 rounded-lg bg-surface-subtle p-3">
          <h4 className="text-sm font-semibold text-foreground">Your submission</h4>
          {learnerAssessmentSubmittedLinkHref(assignment.submissionUrl)?
            <div className="mt-2"><ThirdPartyLink href={learnerAssessmentSubmittedLinkHref(assignment.submissionUrl)!}
              label={assignment.submissionUrl??"Saved link"} /></div>:
            <p className="text-sm text-body">Saved link unavailable.</p>}
        </section>:null}
      {assignment.submissionId && assignment.submissionType === "FILE" ?
        <section aria-label="Your submission" className="mt-4 space-y-3 rounded-lg bg-surface-subtle p-3">
          <h4 className="text-sm font-semibold text-foreground">Your submission</h4>
          {assignment.submissionText?<div>
            <h5 className="text-xs font-semibold text-body">Written response</h5>
            <LearnerFormattedResponse text={assignment.submissionText}/>
          </div>:null}
          <AssignmentFileOpenControl key={assignment.submissionId} submissionId={assignment.submissionId}
            enabled={assignmentFilesRuntimeEnabled()} />
          {multipartAssignmentRuntimeEnabled()?
            <AssignmentSubmissionLinks submissionId={assignment.submissionId}/>:null}
        </section> : null}
      {assignment.gradePublished ? (
        <div className="mt-4 rounded-lg bg-primary-subtle px-3 py-2 text-sm text-body">
          <strong className="text-foreground">
            {learnerAssignmentPublishedGradeLabel(assignment.pointsAwarded,assignment.maxPoints)}
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
      ) : overdue ? (
        <p className="mt-4 text-xs font-semibold text-warning">
          Submissions are closed · Submission deadline has passed
        </p>
      ) : null}

      {!readOnly && !assignment.submissionId && submissionClosed ?
        <div role="status" className="mt-3 space-y-2 text-sm text-warning">
          <p>{assignment.dueAt?"Submissions are closed":"Submission unavailable · deadline missing"}</p>
          <Button type="button" variant="secondary" disabled aria-disabled="true"
            className="min-h-11">
            {assignment.dueAt?"Submission closed":"Unavailable"}
          </Button>
        </div>:null}
      {!readOnly && !submissionClosed && interaction.canSubmit ? (
        <AssignmentSubmissionControl
          key={deliveryId+":"+assignment.id}
          fileUploadsEnabled={assignmentFilesRuntimeEnabled()}
          multipartEnabled={multipartAssignmentRuntimeEnabled()}
          methodsEnabled={true}
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
  readOnly,
}: {
  quiz: Workspace["lessons"][number]["quizzes"][number];
  deliveryId: string;
  readOnly: boolean;
}) {
  const expired = isQuizExpired(
    quiz.attemptsUsed,
    quiz.dueAt,
  );

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
            {expired ? (
              <StatusBadge tone="error">
                Expired
              </StatusBadge>
            ) : quiz.status === "CLOSED" ? (
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
            {expired ? "Was due" : "Due"} {formatDateTime(quiz.dueAt)}
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

      {!readOnly ? (
      <QuizAttemptControl
        quizId={quiz.id}
        deliveryId={deliveryId}
        status={quiz.status}
        attemptsUsed={quiz.attemptsUsed}
        attemptsRemaining={quiz.attemptsRemaining}
        resultsPublished={quiz.resultsPublished}
        progressStatus={quiz.progress.status}
      />
      ) : (
        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Past semester · quiz attempts are read only.
        </p>
      )}
    </article>
  );
}

export function LearnerCourseWorkspace({
  deliveryId,
  workspace,
  filter = "all",
  focusLessonId = null,
  focusContentId = null,
  readOnly = false,
}: {
  deliveryId: string;
  workspace: Workspace;
  filter?: string;
  focusLessonId?: string | null;
  focusContentId?: string | null;
  readOnly?: boolean;
}) {
  const summary = workspace.summary;
  const emptyState = learnerRoadmapEmptyState(Boolean(workspace.learningPath),workspace.lessons);
  const measuredProgress = learnerRoadmapMeasuredProgress(summary);
  const filterNotice=learnerRoadmapFilterRecoveryNotice(filter);
  const activeFilter = resolveLearnerRoadmapFocusFilter(
    filter, focusLessonId, focusContentId, workspace.lessons,
  );

  const filters = [
    { key: "all", label: "All" },
    { key: "lectures", label: "Lectures" },
    { key: "resources", label: "Resources" },
    { key: "assessments", label: "Assessments" },
    { key: "live-sessions", label: "Live sessions" },
  ] as const;

  const matchesFilter = (
    lesson: Workspace["lessons"][number],
    item: Workspace["lessons"][number]["items"][number],
  ) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "assessments") {
      return item.kind === "ASSIGNMENT" || item.kind === "QUIZ";
    }
    if (item.kind !== "CONTENT") return false;
    const content = lesson.contents.find((candidate) => candidate.id === item.id);
    if (!content) return false;
    if (activeFilter === "resources") return content.type === "RESOURCE";
    if (activeFilter === "live-sessions") return content.type === "LIVE_CLASS";
    return content.type === "VIDEO" || content.type === "YOUTUBE";
  };

  const filterCounts = {
    all: workspace.lessons.reduce((sum, lesson) => sum + lesson.items.length, 0),
    lectures: workspace.lessons.reduce(
      (sum, lesson) =>
        sum +
        lesson.contents.filter(
          (content) => content.type === "VIDEO" || content.type === "YOUTUBE",
        ).length,
      0,
    ),
    resources: workspace.lessons.reduce(
      (sum, lesson) =>
        sum + lesson.contents.filter((content) => content.type === "RESOURCE").length,
      0,
    ),
    assessments: workspace.lessons.reduce(
      (sum, lesson) => sum + lesson.assignments.length + lesson.quizzes.length,
      0,
    ),
    "live-sessions": workspace.lessons.reduce(
      (sum, lesson) =>
        sum + lesson.contents.filter((content) => content.type === "LIVE_CLASS").length,
      0,
    ),
  };

  const mobileOutline=learnerRoadmapMobileOutline(
    workspace.lessons.map(lesson=>({
      id:lesson.id,name:lesson.name,sequence:lesson.sequence,
      visibleCount:lesson.items.filter(item=>matchesFilter(lesson,item)).length,
    })),
    activeFilter as "all"|"lectures"|"resources"|"assessments"|"live-sessions",
  );

  if (!workspace.learningPath) {
    return (
      <EmptyState
        title="No roadmap items yet"
        description="Create lessons and add content to show the learner roadmap."
      />
    );
  }

  return (
    <div className="space-y-5">
      {workspace.stateWarnings.length>0 ? (
        <aside role="alert" className="rounded-xl border border-warning bg-surface p-4 text-sm text-body">
          <p className="font-semibold">Some course state could not be loaded</p>
          <p className="mt-1">The lesson list is available, but {workspace.stateWarnings.join(", ")} could not be loaded. Your progress has not been changed.</p>
          <LearnerCourseStateRetry/>
        </aside>
      ) : null}
      {filterNotice ? <p role="status" className="rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-body">{filterNotice}</p> : null}
      {focusLessonId && !workspace.lessons.some(lesson=>lesson.id===focusLessonId)
        ? <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm text-body">
            Lesson not found. This lesson is unavailable in your current learning path.
          </p>
        : focusLessonId && focusContentId && !workspace.lessons.some(lesson=>lesson.id===focusLessonId &&
            lesson.items.some(item=>item.id===focusContentId))
          ? <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm text-body">
              Content unavailable. This item is not published in the selected lesson.
            </p>:null}
      <div>
        <h2 className="sr-only">Learning Path</h2>
        <p className="m-0 text-sm text-body">
          Follow the course in order, open lesson content, submit assessments, and track completion.
        </p>
      </div>

      <section className="border-b border-border pb-5">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              {workspace.learningPath.title}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              {learnerRoadmapHeadline({
                nextItemTitle:workspace.nextItem?.title??null,
                itemsMissed:summary.itemsMissed,
                itemsCompleted:summary.itemsCompleted,
                itemsTotal:summary.itemsTotal,
              })}
            </h3>
            <p className="mt-2 text-sm leading-6 text-body">
              {workspace.learningPath.description ??
                "Lessons and learning items are presented in the order defined for this course."}
            </p>
            {workspace.nextItem ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="info">
                  {kindLabel(workspace.nextItem.kind)}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">
                  {workspace.nextItem.lessonName}
                </span>
              </div>
            ) : null}
          </div>
          <ProgressBar value={measuredProgress} label="Overall Course progress" />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Overall"
          value={measuredProgress === null ? "Not measured" : `${measuredProgress}%`}
          detail={`${summary.itemsCompleted} of ${summary.itemsTotal} learning items complete.`}
        />
        <Metric
          label="Lessons"
          value={`${summary.lessonsCompleted}/${summary.lessonsTotal}`}
          detail="A lesson is complete when all of its actionable items are complete."
        />
        <Metric
          label="Assessments"
          value={summary.assignmentsCompleted + summary.quizzesCompleted}
          detail={`${summary.assignmentsTotal} assignments · ${summary.quizzesTotal} quizzes.`}
        />
        <Metric
          label="Missed"
          value={summary.itemsMissed}
          detail="Closed quizzes remain visible in the learning path."
        />
      </div>

      <ScrollCue axis="x" label="Learning path content filter" className="rounded-xl border border-border bg-surface" viewportClassName="p-2">
      <nav aria-label="Learning path content filter">
        <div className="flex min-w-max gap-1">
          {filters.map((item) => (
            <Link
              key={item.key}
              href={`/learn/courses/${deliveryId}/roadmap?filter=${item.key}`}
              aria-current={activeFilter === item.key ? "page" : undefined}
              className={
                activeFilter === item.key
                  ? "inline-flex min-h-11 items-center rounded-lg bg-primary-subtle px-3 py-2 text-sm font-semibold text-primary-text"
                  : "inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-body hover:bg-muted hover:text-primary-text"
              }
            >
              {item.label}{" "}
              <span className="text-xs text-muted-foreground">
                {filterCounts[item.key]}
              </span>
            </Link>
          ))}
        </div>
      </nav></ScrollCue>

      <details className="rounded-xl border border-border bg-surface sm:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 p-4 text-sm font-semibold text-primary-text">
          Jump to lesson ({mobileOutline.length})
          <span aria-hidden="true">⌄</span>
        </summary>
        {mobileOutline.length ? (
          <nav aria-label="Published lesson index" className="border-t border-border p-2">
            <ol className="space-y-1">
              {mobileOutline.map((lesson,index)=>(
                <li key={lesson.id}>
                  <Link
                    href={`/learn/courses/${encodeURIComponent(deliveryId)}/roadmap?filter=${activeFilter}&lesson=${encodeURIComponent(lesson.id)}#lesson-${encodeURIComponent(lesson.id)}`}
                    className="flex min-h-11 sm:min-h-9 items-center justify-between gap-3 rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-muted">
                    <span className="min-w-0 break-words">{index+1}. {lesson.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{lesson.count} items</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : <p className="border-t border-border p-4 text-sm text-body">
          No published items match this filter.
        </p>}
      </details>
      {emptyState ? (
        <EmptyState title={emptyState.title} description={emptyState.description} />
      ) : null}
      <div className="space-y-4">
        {workspace.lessons.map((lesson, lessonIndex) => {
          const visibleItems = lesson.items.filter((item) => matchesFilter(lesson, item));
          if (focusLessonId && focusLessonId !== lesson.id) return null;
          // Keep empty lessons visible so learners understand what is absent in each filter.

          const lessonProgress = lessonProgressState(
            lesson.items.map((item) => item.progress.status),
            workspace.nextItem?.lessonId === lesson.id,
          );
          const contentCounts = {
            lectures: lesson.contents.filter(
              (content) =>
                content.type === "VIDEO" ||
                content.type === "YOUTUBE",
            ).length,
            resources: lesson.contents.filter(
              (content) => content.type === "RESOURCE",
            ).length,
            assessments:
              lesson.assignments.length +
              lesson.quizzes.length,
            liveSessions: lesson.contents.filter(
              (content) => content.type === "LIVE_CLASS",
            ).length,
          };

          return (
            <details
              id={`lesson-${lesson.id}`}
              key={lesson.id}
              open={
                focusLessonId === lesson.id ||
                (!focusLessonId && (workspace.nextItem?.lessonId === lesson.id ||
                  (!workspace.nextItem && lessonIndex === 0)))
              }
              className="group rounded-xl border border-border bg-[var(--lms-neutral-50)]"
            >
              <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                      {String(lessonIndex + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                      {lesson.name}
                    </h3>
                    {lesson.description ? (
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-body">
                        {lesson.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex max-w-xl flex-wrap items-center justify-end gap-2">
                    {lessonProgress.complete ? (
                      <StatusBadge tone="success">
                        Completed
                      </StatusBadge>
                    ) : lessonProgress.current ? (
                      <StatusBadge tone="info">
                        Continue here
                      </StatusBadge>
                    ) : lessonProgress.inProgress ? (
                      <StatusBadge tone="info">
                        In progress
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Not started</StatusBadge>
                    )}
                    <Badge  tone="neutral">
                      {lessonProgress.completed} of {lessonProgress.total} complete
                    </Badge>
                    {contentCounts.lectures > 0 ? (
                      <Badge  tone="neutral">
                        {contentCounts.lectures} lecture{contentCounts.lectures === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                    {contentCounts.resources > 0 ? (
                      <Badge  tone="neutral">
                        {contentCounts.resources} resource{contentCounts.resources === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                    {contentCounts.assessments > 0 ? (
                      <Badge  tone="neutral">
                        {contentCounts.assessments} assessment{contentCounts.assessments === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                    {contentCounts.liveSessions > 0 ? (
                      <Badge  tone="neutral">
                        {contentCounts.liveSessions} live
                      </Badge>
                    ) : null}
                    <span aria-hidden="true" className="text-primary-text group-open:rotate-90">
                      ›
                    </span>
                  </div>
                </div>
              </summary>

              <div className="border-t border-border bg-surface p-4 sm:p-5">
                {focusLessonId===lesson.id?<nav aria-label="Lesson navigation"
                   className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                  <Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+"/roadmap?filter="+activeFilter}
                    className="font-semibold text-primary-text underline">Back to Learning Path</Link>
                  {workspace.lessons[lessonIndex-1]?<Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+
                    "/roadmap?lesson="+encodeURIComponent(workspace.lessons[lessonIndex-1]!.id)}
                    className="font-semibold text-primary-text underline">Previous lesson</Link>:null}
                  {workspace.lessons[lessonIndex+1]?<Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+
                    "/roadmap?lesson="+encodeURIComponent(workspace.lessons[lessonIndex+1]!.id)}
                    className="font-semibold text-primary-text underline">Next lesson</Link>:null}
                  <span>{lessonProgress.completed} of {lessonProgress.total} complete</span>
                </nav>:null}
                {visibleItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                    {activeFilter==="lectures"?"No lectures in this lesson.":
                      activeFilter==="all"?"No content in this lesson yet.":"No lesson content yet"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleItems.map((item) => {
                      if (item.kind === "CONTENT") {
                        const content = lesson.contents.find(
                          (candidate) => candidate.id === item.id,
                        );
                        return content ? (
                          <LearnerRoadmapItemDialog
                            key={learnerRoadmapDialogKey(
                              lesson.id,item.id,
                              learnerRoadmapShouldOpenItem(lesson.id,item.id,focusLessonId,focusContentId),
                            )}
                            title={content.title}
                            kind="Content"
                            caption={content.type === "LIVE_CLASS" ? "Live session" :
                              content.type === "RESOURCE" ? "Resource" : "Lecture"}
                            progress={item.progress.status}
                            initiallyOpen={learnerRoadmapShouldOpenItem(lesson.id,item.id,focusLessonId,focusContentId)}
                            highlighted={focusContentId===item.id && focusLessonId===lesson.id}
                          >
                            <ContentCard content={content} lessonId={lesson.id} deliveryId={deliveryId} readOnly={readOnly}
                            materialsEnabled={resourceMaterialsRuntimeEnabled()}
                            saveIntervalMs={workspace.playbackSettings.saveIntervalMs}/>
                          </LearnerRoadmapItemDialog>
                        ) : null;
                      }

                      if (item.kind === "ASSIGNMENT") {
                        const assignment = lesson.assignments.find(
                          (candidate) => candidate.id === item.id,
                        );
                        return assignment ? (
                          <LearnerRoadmapItemDialog
                            key={learnerRoadmapDialogKey(
                              lesson.id,item.id,
                              learnerRoadmapShouldOpenItem(lesson.id,item.id,focusLessonId,focusContentId),
                            )}
                            title={assignment.title}
                            kind="Assignment"
                            caption="Assignment" dueText={assignment.dueAt?(formatDateTime(assignment.dueAt)??undefined):undefined}
                            progress={item.progress.status}
                            initiallyOpen={learnerRoadmapShouldOpenItem(lesson.id,item.id,focusLessonId,focusContentId)}
                            highlighted={focusContentId===item.id && focusLessonId===lesson.id}
                          >
                            <AssignmentCard assignment={assignment} deliveryId={deliveryId} readOnly={readOnly} />
                          </LearnerRoadmapItemDialog>
                        ) : null;
                      }

                      const quiz = lesson.quizzes.find(
                        (candidate) => candidate.id === item.id,
                      );
                      return quiz ? (
                        <LearnerRoadmapItemDialog
                          key={learnerRoadmapDialogKey(
                            lesson.id,item.id,
                            learnerRoadmapShouldOpenItem(lesson.id,item.id,focusLessonId,focusContentId),
                          )}
                          title={quiz.title}
                          kind="Quiz"
                          caption="Quiz" dueText={quiz.dueAt?(formatDateTime(quiz.dueAt)??undefined):undefined}
                          progress={item.progress.status}
                          initiallyOpen={learnerRoadmapShouldOpenItem(lesson.id,item.id,focusLessonId,focusContentId)}
                          highlighted={focusContentId===item.id && focusLessonId===lesson.id}
                        >
                          <QuizCard quiz={quiz} deliveryId={deliveryId} readOnly={readOnly} />
                        </LearnerRoadmapItemDialog>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {activeFilter !== "all" &&
      workspace.lessons.every(
        (lesson) => lesson.items.filter((item) => matchesFilter(lesson, item)).length === 0,
      ) ? (
        <EmptyState
          title={`No ${filters.find((item) => item.key === activeFilter)?.label ?? "content"} in this course`}
          description="Choose another content filter to continue browsing the learning path."
        />
      ) : null}
    </div>
  );
}
