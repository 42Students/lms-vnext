import { MetricBar } from "@/components/ui/metric-bar";
import progressStyles from "./learner-course-progress.module.css";
import { Disclosure } from "@/components/ui/disclosure";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Tabs } from "@/components/ui/tabs";
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
import { legacySyllabusKind,selectedLessonCompletion } from "@/modules/courses/legacy-syllabus-detail-model";
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
      <MetricBar size="medium" className={progressStyles.track} role="progressbar"
        label={label} value={value} maximum={100} unit="percent" />
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
  if(legacySyllabusKind(content.type)!=="CONTENT"||
     !["RESOURCE","VIDEO","YOUTUBE","LIVE_CLASS"].includes(content.type))
   return <div role="status" className="space-y-2 border-b border-border py-3">
    <h3 className="font-semibold">{content.title}</h3>
    <Alert tone="warning">This content type isn&apos;t supported yet. Contact your instructor if this looks wrong.</Alert>
   </div>;

  return (
    <article
      id={`item-CONTENT-${content.id}`}
      className="min-w-0 scroll-mt-28"
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
        <div className="mt-4 border-l-[3px] border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] px-3 py-2 text-sm leading-6 text-body">
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
        <div className="mt-4 border-l-[3px] border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] px-3 py-2 text-sm leading-6 text-body">
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
            className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-text md:w-auto"
          >
            Open resource ↗
          </a>
          <a
            href={`/api/courses/deliveries/${encodeURIComponent(deliveryId)}/contents/${encodeURIComponent(content.id)}/file?download=1`}
            className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-text md:w-auto"
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
      className="min-w-0 scroll-mt-28"
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
          Not submitted · Submission deadline has passed. You can still review the instructions.
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
      className="min-w-0 scroll-mt-28"
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
        <Alert tone="warning" className="mt-4">
          This quiz is no longer available for an attempt.
        </Alert>
      ) : quiz.progress.status ===
        "COMPLETED" ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge tone="success">Attempt recorded</StatusBadge>
          {quiz.resultsPublished
            ? "Results are published."
            : "Results are not published yet."}
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
  const progressUnknown=workspace.stateWarnings.length>0;
  const emptyState = learnerRoadmapEmptyState(Boolean(workspace.learningPath),workspace.lessons);
  const measuredProgress = progressUnknown?null:learnerRoadmapMeasuredProgress(summary);
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
    <div className="min-w-0 space-y-5">
      {progressUnknown ? (
        <Alert tone="warning" role="alert" title="Lesson completion state could not be fully verified">
          <p className="mt-1">The lesson list is available, but {workspace.stateWarnings.join(", ")} could not be loaded. Completion/counts may be incomplete. Content remains accessible; completion counts and Continue recommendations are unavailable until verification succeeds.</p>
          <LearnerCourseStateRetry/>
        </Alert>
      ) : null}
      {filterNotice ? <Alert tone="warning">{filterNotice}</Alert> : null}
      {focusLessonId && !workspace.lessons.some(lesson=>lesson.id===focusLessonId)
        ? <Alert tone="error" role="alert">
            Lesson not found. This lesson is unavailable in your current learning path.
          </Alert>
        : focusLessonId && focusContentId && !workspace.lessons.some(lesson=>lesson.id===focusLessonId &&
            lesson.items.some(item=>item.id===focusContentId))
          ? <Alert tone="error" role="alert">
              Content locked or unavailable. This item is not published in the selected lesson.
            </Alert>:null}
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
              {progressUnknown?"Lesson content may be out of date":learnerRoadmapHeadline({
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
            {!progressUnknown&&workspace.nextItem ? (
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
          {progressUnknown?<p role="status" className="text-sm text-warning">Lesson completion state could not be fully verified. Retry state before using this progress estimate.</p>:
           <ProgressBar value={measuredProgress} label="Overall Course progress" />}
        </div>
      </section>

      {!progressUnknown?<Disclosure title="Learning progress breakdown"
        className="border-b border-border pb-3" contentClassName="pt-3">
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Overall"
          value={measuredProgress === null ? "Not measured" : `${measuredProgress}%`}
          detail={`${summary.itemsCompleted} of ${summary.itemsTotal} learning items complete.`}
        />
        <StatTile
          label="Lessons"
          value={`${summary.lessonsCompleted}/${summary.lessonsTotal}`}
          detail="A lesson is complete when all of its actionable items are complete."
        />
        <StatTile
          label="Assessments"
          value={summary.assignmentsCompleted + summary.quizzesCompleted}
          detail={`${summary.assignmentsTotal} assignments · ${summary.quizzesTotal} quizzes.`}
        />
        <StatTile
          label="Missed"
          value={summary.itemsMissed}
          detail="Closed quizzes remain visible in the learning path."
        />
        </div>
      </Disclosure>:null}

      <Tabs
        ariaLabel="Learning path content filter"
        value={activeFilter}
        renderPanel={false}
        items={filters.map(item => ({
          value: item.key,
          label: item.label,
          count: filterCounts[item.key],
          href: `/learn/courses/${encodeURIComponent(deliveryId)}/roadmap?filter=${encodeURIComponent(item.key)}`,
        }))}
      />

      <Disclosure title={"Jump to lesson ("+mobileOutline.length+")"}
          className="rounded-xl border border-border bg-surface md:hidden [&>summary]:min-h-11 [&>summary]:p-4">
        {mobileOutline.length ? (
          <nav aria-label="Published lesson index" className="border-t border-border p-2">
            <ol className="space-y-1">
              {mobileOutline.map((lesson,index)=>(
                <li key={lesson.id}>
                  <Link
                    href={`/learn/courses/${encodeURIComponent(deliveryId)}/roadmap?filter=${activeFilter}&lesson=${encodeURIComponent(lesson.id)}#lesson-${encodeURIComponent(lesson.id)}`}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
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
      </Disclosure>
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
            !progressUnknown&&workspace.nextItem?.lessonId === lesson.id,
          );
          const lessonCompletion=selectedLessonCompletion(lesson.items,!progressUnknown);
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
            <Disclosure id={`lesson-${lesson.id}`} key={lesson.id}
              defaultOpen={
                focusLessonId === lesson.id ||
                (!focusLessonId && (workspace.nextItem?.lessonId === lesson.id ||
                  (!workspace.nextItem && lessonIndex === 0)))
              }
              preserveSummary
              summaryClassName="cursor-pointer list-none px-4 py-4 md:px-5"
              title={<>

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
                    {progressUnknown?<StatusBadge tone="warning">Completion unverified</StatusBadge> : lessonProgress.complete ? (
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
                    <Badge tone="neutral">
                      {lessonCompletion.stateKnown
                        ?lessonCompletion.completed+" of "+lessonCompletion.total+" complete"
                        :"Completion unavailable"}
                    </Badge>
                    <span aria-hidden="true" className="text-primary-text group-open:rotate-90">
                      ›
                    </span>
                  </div>
                </div>
              
              </>}
              className="group min-w-0 border-b border-border bg-surface">

              <div className="border-t border-border bg-surface p-4 md:p-5">
                {lessonCompletion.stateKnown? <div className="mb-4 space-y-2">
                  <ProgressBar value={lessonCompletion.percent} label={lesson.name+" progress"}/>
                  {lessonCompletion.nextIncomplete?<Link
                    href={"/learn/courses/"+encodeURIComponent(deliveryId)+"/roadmap?lesson="+encodeURIComponent(lesson.id)+"&content="+encodeURIComponent(lessonCompletion.nextIncomplete.id)}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
                    Continue: {lessonCompletion.nextIncomplete.title??"Next incomplete item"}
                  </Link>:null}
                </div>:<p role="status" className="mb-4 text-sm text-warning">
                  Lesson completion state could not be fully verified. Retry state before marking this lesson complete.
                </p>}
                <div className="mb-3 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {contentCounts.lectures > 0 ? (
                    <span>{contentCounts.lectures} lecture{contentCounts.lectures === 1 ? "" : "s"}</span>
                  ) : null}
                  {contentCounts.resources > 0 ? (
                    <span>{contentCounts.resources} resource{contentCounts.resources === 1 ? "" : "s"}</span>
                  ) : null}
                  {contentCounts.assessments > 0 ? (
                    <span>{contentCounts.assessments} assessment{contentCounts.assessments === 1 ? "" : "s"}</span>
                  ) : null}
                  {contentCounts.liveSessions > 0 ? (
                    <span>{contentCounts.liveSessions} live</span>
                  ) : null}
                </div>
                {focusLessonId===lesson.id?<nav aria-label="Lesson navigation"
                   className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                  <Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+"/roadmap?filter="+activeFilter}
                    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Back to Learning Path</Link>
                  {workspace.lessons[lessonIndex-1]?<Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+
                    "/roadmap?lesson="+encodeURIComponent(workspace.lessons[lessonIndex-1]!.id)}
                    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Previous lesson</Link>:null}
                  {workspace.lessons[lessonIndex+1]?<Link href={"/learn/courses/"+encodeURIComponent(deliveryId)+
                    "/roadmap?lesson="+encodeURIComponent(workspace.lessons[lessonIndex+1]!.id)}
                    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Next lesson</Link>:null}
                  <span>{lessonCompletion.stateKnown
                    ?lessonCompletion.completed+" of "+lessonCompletion.total+" complete"
                    :"Completion unavailable"}</span>
                </nav>:null}
                {visibleItems.length === 0 ? (
                  <div className="border-t border-border py-4 text-sm text-muted-foreground">
                    {activeFilter==="lectures"?"No lectures in this lesson.":
                      activeFilter==="resources"?"No resources in this lesson.":
                      activeFilter==="assessments"?"No assessments in this lesson.":
                      activeFilter==="live-sessions"?"No live sessions in this lesson.":
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
                            focusKey={deliveryId+":"+lesson.id+":"+item.id}
                            locked={content.availability==="SCHEDULED"&&content.type!=="LIVE_CLASS"}
                            availability={content.availability}
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
                            focusKey={deliveryId+":"+lesson.id+":"+item.id}
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
                          focusKey={deliveryId+":"+lesson.id+":"+item.id}
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
            </Disclosure>
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
          action={
            <Link href={`/learn/courses/${encodeURIComponent(deliveryId)}/roadmap?filter=all`}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
              Show all
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
