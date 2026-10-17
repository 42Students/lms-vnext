import Link from "next/link";
import { mentorMeetingDisplayStatus } from "@/modules/projects/mentor-meeting-display-status";
import {mentorEstimateLabel} from "@/modules/projects/mentor-estimation-unit-model";
import {mentorMeetingFacilitationSchema} from "@/modules/projects/mentor-meeting-facilitation-model";
import { safeProjectExternalHref, showMentorTaskCriteria, mentorSprintTaskFacts, mentorSprintEmptyWorkNotice, mentorTaskReviewEvidence, mentorTaskFeedbackHref, mentorWorkspaceMissingPrimaryMentor, mentorRequiredResourceLinkState } from "@/modules/projects/mentor-workspace-evidence-model";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectArchiveControl } from "./project-archive-control";
import { ProjectAdminSubmissionReview } from "./project-admin-submission-review";
import {CollegeProjectSummaryEditorFull} from "./college-project-summary-editor-full";
import {WorkspaceBriefEditor} from "./workspace-brief-editor";
import {parseWorkspaceBrief} from "@/modules/projects/workspace-brief-model";
import { mentorAuthoredBrief, mentorReviewSubmissionHref } from "@/modules/projects/mentor-overview-presenter";
import { ProjectResourceFilesSection } from "./project-resource-files-section";
import { ProjectDeliveryEvidenceDownload } from "./project-delivery-evidence-download";
import {ProjectDeliveryReopenControl} from "./project-delivery-reopen-control";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {learnerSprintRollup,learnerSprintProgress} from "@/modules/projects/learner-sprint-progress-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { MentorSprintDetailsEdit } from "./mentor-sprint-details-edit";
import {MentorSprintDeleteControl} from "./mentor-sprint-delete-control";
import {ProjectActivityFilteredList} from "./project-activity-filtered-list";
import {CollegeProjectMentorDialog} from "./college-project-mentor-dialog";
import {CollegeProjectStudentRosterDialog} from "./college-project-student-roster-dialog";
import {ProjectResourceList} from "./project-resource-list";
import {MentorDeliveryLockControl} from "./mentor-delivery-lock-control";
import { MentorSprintCreate, MentorSprintTransition } from "./mentor-sprint-write";
import {MentorReleaseEditor} from "./mentor-release-editor";
import {MentorMeetingHistory} from "./mentor-meeting-history";
import { MentorTaskDetailsEdit } from "./mentor-task-details-edit";
import { ProjectTaskAssigneeControl } from "./project-task-assignee-control";
import {ProjectTaskComments} from "./project-task-comments";
import { LearnerTaskProgressControl } from "./learner-task-progress-control";
import { learnerTaskCriteriaPreview } from "@/modules/projects/learner-task-criteria-model";
import { projectTaskVisibleFacts,projectTaskDueState } from "@/modules/projects/project-task-visible-facts-model";
import { MentorTaskCreate } from "./mentor-task-create";
import { MentorTaskStatusTransition } from "./mentor-task-status-transition";
import {
  ReleaseLifecycleActions,
  SprintLifecycleActions,
  TaskLifecycleActions,
  TaskReviewActions,
} from "./project-lifecycle-actions";
import {
  FinalReviewControl,
  LearnerFinalDeliveryControl,
  ProjectEvaluationControl,
} from "./project-final-delivery-controls";
import {
  ProjectTaskSubmissionControl,
} from "./project-task-submission-control";
import {CreateProjectResourceControl} from "./project-resource-controls";
import {
  ProjectMeetingTransitionActions,
  RequestProjectMeetingControl,
  ScheduleProjectMeetingControl,
} from "./project-meeting-controls";
import {
  AddProjectMemberControl,
  ProjectMemberActions,
} from "./project-team-controls";
import type {
  getProjectWorkspaceView,
} from "@/modules/projects/workspace-view-service";

type Workspace = Awaited<
  ReturnType<typeof getProjectWorkspaceView>
>;

export const PROJECT_WORKSPACE_SECTIONS = [
  "summary",
  "overview",
  "team",
  "sprints",
  "tasks",
  "resources",
  "meetings",
  "readiness",
  "delivery",
  "audit",
] as const;

export type ProjectWorkspaceSection =
  (typeof PROJECT_WORKSPACE_SECTIONS)[number];

const PROJECT_WORKSPACE_SECTION_LABELS: Record<
  ProjectWorkspaceSection,
  string
> = {
  summary: "Summary",
  overview: "Overview",
  team: "Team",
  sprints: "Sprints",
  tasks: "Tasks",
  resources: "Resources",
  meetings: "Meetings",
  readiness: "Readiness",
  delivery: "Delivery",
  audit: "Audit",
};

function tone(status: string) {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
    case "DONE":
    case "SHIPPED":
    case "APPROVED":
      return "success" as const;
    case "PLANNED":
    case "IN_PROGRESS":
    case "IN_REVIEW":
    case "SCHEDULED":
    case "SUBMITTED":
      return "info" as const;
    case "MISSED":
      return "error" as const;
    case "BLOCKED":
    case "CHANGES_REQUESTED":
    case "REQUESTED":
      return "warning" as const;
    case "CANCELLED":
    case "ARCHIVED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function Metric({
  label: metricLabel,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {metricLabel}
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

function safeHttpHref(value: string | null) {
  return safeProjectExternalHref(value);
}

function formatDateTime(value: Date | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(value);
}

export function ProjectWorkspace({
  workspace,
  backHref,
  backLabel,
  mode,
  currentMembershipId,
  activeSection,
  sectionBaseHref,
  sectionQuerySuffix = "",
  riskReason = null,
  readOnlyOverride = false,
}: {
  workspace: Workspace;
  backHref: string;
  backLabel: string;
  mode: "LEARNER" | "MENTOR" | "ADMIN";
  currentMembershipId: string | null;
  activeSection?: ProjectWorkspaceSection;
  sectionBaseHref?: string;
  sectionQuerySuffix?: string;
  riskReason?: string | null;
  readOnlyOverride?: boolean;
}) {
  const { readiness } = workspace;
  const authoredBrief=parseWorkspaceBrief(workspace.project.authoredBrief);
  const templateBrief=mentorAuthoredBrief(workspace.templateOverview);
  const isAuthored=Boolean(authoredBrief.goal||authoredBrief.description||
    authoredBrief.deliverables.length||authoredBrief.completionConditions.length||authoredBrief.personas.length);
  const brief=isAuthored?{
    goal:authoredBrief.goal,description:authoredBrief.description,
    deliverables:authoredBrief.deliverables,
  }:templateBrief;
  const mentorReviewHref = mode === "MENTOR"
    ? mentorReviewSubmissionHref(workspace.project.id, workspace.finalDelivery.submissions)
    : null;
  const show = (section: ProjectWorkspaceSection) =>
    !activeSection ||
    activeSection === section ||
    (mode !== "ADMIN" &&
      activeSection === "team" &&
      section === "meetings");
  const renderTime = new Date();
  const archived = workspace.project.status === "ARCHIVED";
  const readOnly = archived || workspace.project.status === "COMPLETED" || readOnlyOverride;
  const tasksBySprint = new Map<
    string | null,
    Workspace["tasks"]
  >();
  for (const task of workspace.tasks) {
    const rows =
      tasksBySprint.get(task.sprintId) ?? [];
    rows.push(task);
    tasksBySprint.set(task.sprintId, rows);
  }

  const sprintsByRelease = new Map<
    string,
    Workspace["sprints"]
  >();
  for (const sprint of workspace.sprints) {
    const rows =
      sprintsByRelease.get(sprint.releaseId) ?? [];
    rows.push(sprint);
    sprintsByRelease.set(sprint.releaseId, rows);
  }

  const taskSubmissions = new Map<
    string,
    Workspace["taskSubmissions"]
  >();
  for (const submission of workspace.taskSubmissions) {
    const rows =
      taskSubmissions.get(submission.taskId) ?? [];
    rows.push(submission);
    taskSubmissions.set(
      submission.taskId,
      rows,
    );
  }

  const reviewsBySubmission = new Map(
    workspace.finalDelivery.reviews.map(
      (review) => [
        review.submissionId,
        review,
      ] as const,
    ),
  );
  const evaluationsBySubmission = new Map(
    workspace.evaluation.evaluations.map(
      (evaluation) => [
        evaluation.submissionId,
        evaluation,
      ] as const,
    ),
  );

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        {backLabel === "Projects" ? "Back to projects" : backLabel}
      </Link>

      {mode === "ADMIN" ? <nav aria-label="Workspace breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Link href={backHref}>Projects</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{workspace.project.title}</span>
      </nav> : null}
      {sectionBaseHref ? (
        <nav
          aria-label="Project workspace sections"
          className="flex max-w-full gap-2 overflow-x-auto border-b border-border pb-3 focus-visible:outline-2" tabIndex={0}
        >
          {PROJECT_WORKSPACE_SECTIONS.map((section) => (
            <Link
              key={section}
              href={sectionBaseHref + "/" + section + sectionQuerySuffix}
              aria-current={
                activeSection === section ? "page" : undefined
              }
              className={
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition " +
                (activeSection === section
                  ? "bg-primary text-primary-foreground"
                  : "text-body hover:bg-muted hover:text-foreground")
              }
            >
              {PROJECT_WORKSPACE_SECTION_LABELS[section]}
            </Link>
          ))}
        </nav>
      ) : null}

      <PageHeader
        title={workspace.project.title}
        description={mode==="MENTOR"
          ? [workspace.project.courseLabel??"Course not linked",
             "Mentor: "+(workspace.members.find(member=>member.role==="MENTOR"&&member.isPrimary)?.displayName
               ?? workspace.members.find(member=>member.role==="MENTOR")?.displayName??"Not assigned")].join(" · ")
          : (workspace.project.summary ?? undefined)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={tone(workspace.project.status)}
            >
              {label(workspace.project.status)}
            </StatusBadge>
            {mode === "ADMIN" ? (
              <ProjectArchiveControl
                projectId={workspace.project.id}
                projectTitle={workspace.project.title}
                status={workspace.project.status}
                expectedUpdatedAt={workspace.project.updatedAt.toISOString()}
              />
            ) : null}
          </div>
        }
      />

      {mode === "ADMIN" && riskReason ? (
        <section role="status" className="rounded-xl border border-warning-border bg-surface p-4 text-sm">
          Opened from At-risk projects · {riskReason === "STALLED" ? "Stalled" : riskReason === "BLOCKER" ? "Active blocker" : "Pending review"}
        </section>
      ) : null}

      {mode === "ADMIN" && show("readiness") ? (
        <Link href={"/admin/projects/readiness?projectId=" + encodeURIComponent(workspace.project.id)}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary-text">
          Manage override
        </Link>
      ) : null}

      {readOnly ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-muted p-4"
        >
          <p className="m-0 text-sm font-semibold text-foreground">
            {archived && mode==="LEARNER"?"This workspace is archived, so it is read-only.":archived?"Archived workspace":workspace.project.status==="COMPLETED"?"Completed project · read only":"Read-only project access"}
          </p>
          <p className="mt-1 text-sm leading-6 text-body">
            {archived && mode==="MENTOR"?"This workspace is archived. You can read everything here, but tasks, resources, meetings and the submission can no longer be changed.":workspace.project.status==="COMPLETED"?"This project is complete. Existing work and meetings remain available to read; editing is disabled.":"Team, execution, delivery, resources, meetings and activity remain available for review. Mutations are disabled."}
          </p>
        </section>
      ) : null}

      {mode==="ADMIN"&&show("summary")&&!readOnly?<CollegeProjectSummaryEditorFull
        project={workspace.project}/>:null}
      {show("summary") || show("readiness") || (mode === "MENTOR" && show("overview")) ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Tasks"
            value={
              readiness.execution.tasks.done +
              "/" +
              readiness.execution.tasks.total
            }
            detail="Tasks completed across the project."
          />
          <Metric
            label="Sprints"
            value={
              readiness.execution.sprints.completed +
              "/" +
              readiness.execution.sprints.total
            }
            detail="Sprints completed."
          />
          <Metric
            label="Releases"
            value={
              readiness.execution.releases.shipped +
              "/" +
              readiness.execution.releases.total
            }
            detail="Releases shipped."
          />
          <Metric
            label="Final submission"
            value={
              readiness.finalSubmission.latest
                ? label(
                    readiness.finalSubmission.latest
                      .status,
                  )
                : "Not started"
            }
            detail={
              readiness.evaluation.exists
                ? "Evaluation recorded."
                : readiness.finalSubmission.approved
                  ? "Approved and ready for evaluation."
                  : "Tracks the latest final submission."
            }
          />
        </div>
      ) : null}

      {mode === "LEARNER" && show("delivery") ? (
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-semibold text-foreground">
                Your final submission
              </h2>

            </div>
            {!readOnly ? <LearnerFinalDeliveryControl
              projectId={workspace.project.id}
              latest={
                workspace.finalDelivery.submissions.at(-1) ??
                null
              }
              canCreateDraft={
                readiness.finalSubmission.canCreateDraft
              }
              canSubmitDraft={
                readiness.finalSubmission.canSubmitDraft
              }
              review={(()=>{
                const latestReview=workspace.finalDelivery.reviews.at(-1);
                return latestReview?{status:latestReview.decision,feedback:latestReview.feedback}:null;
              })()}
              lastEditedBy={(()=>{
                const latest=workspace.finalDelivery.submissions.at(-1);
                if(!latest)return null;
                const edited=workspace.activity.filter(event=>event.subjectId===latest.id&&
                  (event.eventType==="projects.delivery.draft_updated"||
                   event.eventType==="projects.delivery.draft_created"))
                  .sort((a,b)=>new Date(b.occurredAt).getTime()-new Date(a.occurredAt).getTime())[0];
                return edited?.actorDisplayName??(edited?null:
                  workspace.members.find(member=>member.membershipId===latest.createdByMembershipId)?.displayName??null);
              })()}

              readinessDetail={{
                tasksRemaining:Math.max(0,readiness.execution.tasks.total-readiness.execution.tasks.done),
                sprintsRemaining:Math.max(0,readiness.execution.sprints.total-readiness.execution.sprints.completed),
                releasesRemaining:Math.max(0,readiness.execution.releases.total-readiness.execution.releases.shipped),
              }}
            /> : null}
          </div>
        </section>
      ) : null}

      {show("overview") ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold text-foreground">{mode==="ADMIN"?"Overview":"About this project"}</h2>
            {mentorReviewHref ? <Link href={mentorReviewHref}
              className="inline-flex min-h-10 items-center rounded-md border border-primary px-3 text-sm font-semibold text-primary-text">
              Review submission
            </Link> : null}
          </div>
          {mode==="ADMIN"&&!readOnly?<WorkspaceBriefEditor
            projectId={workspace.project.id} initial={authoredBrief}
            updatedAt={workspace.project.updatedAt}/>:null}
          {(isAuthored&&authoredBrief.completionConditions.length>0)||
            (isAuthored&&authoredBrief.personas.length>0)?<div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><h3 className="text-sm font-semibold">Completion conditions</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">{authoredBrief.completionConditions.map((v,i)=><li key={i}>{v}</li>)}</ul>
            </div>
            <div><h3 className="text-sm font-semibold">Personas</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">{authoredBrief.personas.map((v,i)=><li key={i}>{v}</li>)}</ul>
            </div>
          </div>:null}
          {mode!=="ADMIN"?<div className="mt-4 grid gap-3 sm:grid-cols-2">
            <section className="rounded-lg border border-border p-3">
              <h3 className="font-semibold text-foreground">Definition of done</h3>
              <p className="mt-1 text-sm text-body">
                Finish the planned tasks, have each sprint signed off, and send the final submission for mentor review.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Submission also needs all {workspace.sprints.length} sprint(s) signed off.
              </p>
            </section>
            <section className="rounded-lg border border-border p-3">
              <h3 className="font-semibold text-foreground">Who’s who</h3>
              <ul className="mt-2 space-y-1 text-sm text-body">
                <li>Mentor · Reviews tasks and final delivery</li>
                <li>Project team · Works on assigned tasks and shared submissions</li>
                {workspace.members.filter(m=>m.role==="MENTOR").slice(0,2).map(m=>
                  <li key={m.membershipId}>{m.displayName} · Mentor</li>)}
              </ul>
            </section>
          </div>:null}
          {mode==="MENTOR"?<section aria-label="Final submission" className="mt-4 rounded-lg border border-border p-3 text-sm text-body">
            <h3 className="font-semibold text-foreground">Final submission</h3>
            <p className="mt-1">Status: {readiness.finalSubmission.latest?label(readiness.finalSubmission.latest.status):"Not submitted"}</p>
            <Link href={mentorReviewHref??("/mentor/projects/"+workspace.project.id+"?tab=delivery")}
              className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary-text underline">Review submission</Link>
          </section>:null}
          {mode==="MENTOR"?<section aria-label="Mentor task progress" className="mt-4 rounded-lg border border-border p-3">
            <h3 className="font-semibold">Task progress</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {groupLearnerBoardLanes(workspace.tasks,workspace.sprints).map(lane=>
                <div key={lane.id} className="rounded-lg bg-muted p-2 text-center">
                  <p className="text-xl font-bold tabular-nums">{lane.tasks.length}</p>
                  <p className="text-xs text-body">{lane.label}</p>
                </div>)}
            </div>
            <p className="mt-2 text-xs text-body">Submission also needs all {readiness.execution.sprints.total}
              {" "}sprints signed off ({readiness.execution.sprints.completed} so far).</p>
          </section>:null}
          {mode==="LEARNER"?<section aria-label="Task completion donut" className="mt-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Task completion</h3>
            {readiness.execution.tasks.total>0?<div className="mt-3 flex flex-wrap items-center gap-4">
              <svg viewBox="0 0 42 42" role="img"
                aria-label={Math.round(100*readiness.execution.tasks.done/readiness.execution.tasks.total)+"% tasks completed"}
                className="size-28 shrink-0">
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="currentColor"
                  className="text-muted" strokeWidth="6"/>
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="currentColor"
                  className="text-primary" strokeWidth="6"
                  strokeDasharray={String(100*readiness.execution.tasks.done/readiness.execution.tasks.total)+" "+String(100*(readiness.execution.tasks.total-readiness.execution.tasks.done)/readiness.execution.tasks.total)}
                  transform="rotate(-90 21 21)"/>
                <text x="21" y="23" textAnchor="middle" fontSize="7" fill="currentColor">
                  {Math.round(100*readiness.execution.tasks.done/readiness.execution.tasks.total)}%
                </text>
              </svg>
              <div className="min-w-0 text-sm text-body">
                {readiness.execution.tasks.done} of {readiness.execution.tasks.total} tasks completed
              </div>
            </div>:<p className="mt-2 text-sm text-body">
              No tasks on the board yet. Add your first task to start tracking progress.
            </p>}
            {readiness.execution.sprints.total>0?
              <p className="mt-3 text-xs text-body">Submission also needs all {readiness.execution.sprints.total}
                {" "}sprints signed off ({readiness.execution.sprints.completed} so far).</p>:
              <p className="mt-3 text-xs text-body">Tasks only — this project has no sprints.</p>}
          </section>:null}
          {mode==="LEARNER"?<section aria-label="Task lane progress" className="mt-4 rounded-lg border border-border p-3">
            <h3 className="font-semibold text-foreground">Task progress</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {groupLearnerBoardLanes(workspace.tasks,workspace.sprints).map(lane=>
                <div key={lane.id} className="rounded-lg bg-muted p-2 text-center">
                  <p className="text-xl font-bold tabular-nums">{lane.tasks.length}</p>
                  <p className="text-xs text-body">{lane.label}</p>
                </div>)}
            </div>
          </section>:null}
          {workspace.templateOverview||isAuthored ? (
            <div className="mt-3 space-y-4 text-sm leading-6 text-body">
              {brief.goal ? <div>
                <h3 className="font-semibold text-foreground">Project goal</h3>
                <p className="whitespace-pre-wrap">{brief.goal}</p>
              </div> : null}
              {brief.description ? <div>
                <h3 className="font-semibold text-foreground">Description</h3>
                <p className="whitespace-pre-wrap">{brief.description}</p>
              </div> : null}
              <div>
                <h3 className="font-semibold text-foreground">Deliverables</h3>
                {brief.deliverables.length ? (
                  <ul className="list-disc space-y-1 pl-6">
                    {brief.deliverables.map((deliverable, index) => (
                      <li key={index}>{deliverable}</li>
                    ))}
                  </ul>
                ) : <p>No deliverables have been recorded yet.</p>}
              </div>
            </div>
          ) : <p className="mt-2 text-sm text-body">No authored project brief is available.</p>}
          {mode === "LEARNER" ? (
            <div className="mt-3 space-y-2 text-sm text-body">
              {workspace.project.phase ? <p>Phase: <strong>{workspace.project.phase}</strong></p> : null}
              {workspace.project.dueLabel || workspace.project.endDate ?
                <p>Due date: <strong>{workspace.project.endDate?
                  (projectTaskDueState(workspace.project.endDate,workspace.project.status==="COMPLETED"?"DONE":"TODO",renderTime)
                    ??"Due")+" · ":""}{workspace.project.dueLabel ||
                  workspace.project.endDate}</strong></p> : <p>No due date</p>}
              {workspace.project.nextAction ?
                <p>Next step: {workspace.project.nextAction}</p> : null}
              {workspace.project.blocker ?
                <div className="rounded-lg border border-warning-border bg-warning-subtle p-3">
                  <p className="font-semibold">Requires attention</p>
                  <p className="mt-1 whitespace-pre-wrap">{workspace.project.blocker}</p>
                  <Link href={"/learn/projects/"+workspace.project.id+"?tab=board&taskStatus=BLOCKED"}
                    className="inline-flex min-h-10 items-center text-primary-text underline">
                    Open blocked work
                  </Link>
                </div> : null}
            </div>
          ) : null}
          {mode === "LEARNER" ? (
            <section className="mt-4 rounded-lg border border-border bg-surface-subtle p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Final submission</h3>
                <StatusBadge tone={readiness.finalSubmission.latest?.status === "APPROVED" ? "success" :
                  readiness.finalSubmission.latest?.status === "SUBMITTED" ? "info" : "warning"}>
                  {readiness.finalSubmission.latest?.status === "APPROVED" ? "Accepted" :
                    readiness.finalSubmission.latest?.status === "SUBMITTED" ? "Submitted" :
                    readiness.finalSubmission.canSubmitDraft ? "Ready for review" : "Waiting for completion"}
                </StatusBadge>
              </div>
              <p className="mt-2 text-sm text-body">{readiness.finalSubmission.latest
                ? "Latest submission: " + label(readiness.finalSubmission.latest.status)
                : readiness.finalSubmission.canSubmitDraft?"Ready for review. Submit final work on behalf of your team.":"What’s left: complete all tasks, sign off each sprint and ship releases before submitting."}</p>
              {workspace.finalDelivery.reviews.at(-1)?.feedback ? (
                <p className="mt-2 text-sm text-body">Mentor left feedback ({workspace.finalDelivery.reviews.at(-1)?.decision?.replaceAll("_"," ")}) — open Final submission to read it. {
                  workspace.finalDelivery.reviews.at(-1)?.feedback
                }</p>
              ) : null}
              <Link href={"/learn/projects/" + workspace.project.id + "?tab=delivery"}
                className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
                {readiness.finalSubmission.latest?.status === "CHANGES_REQUESTED"
                  ? "Update your submission" : "Open final submission"}
              </Link>
            </section>
          ) : null}
          {mode === "LEARNER" ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-semibold text-foreground">Mentor</p>
                  <p className="mt-1 text-body">{workspace.members.find(member =>
                    member.role === "MENTOR" && member.isPrimary)?.displayName ??
                    workspace.members.find(member => member.role === "MENTOR")?.displayName ??
                    "Not assigned"}</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-semibold text-foreground">Next step</p>
                  <Link href={"/learn/projects/" + workspace.project.id + "?tab=board"}
                    className="mt-1 inline-flex min-h-10 items-center font-semibold text-primary-text hover:underline">
                    Open the Board →
                  </Link>
                </div>
              </div>
              {workspace.tasks.some(task => task.status === "BLOCKED") ? (
                <div className="rounded-lg border border-warning-border bg-warning-subtle p-3">
                  <h3 className="text-sm font-semibold">Requires attention</h3>
                  <p className="mt-1 text-sm text-body">One or more tasks are blocked.</p>
                  <Link href={"/learn/projects/" + workspace.project.id + "?tab=board&taskStatus=BLOCKED"}
                    className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
                    Open blocked work
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          {mode==="MENTOR"?<section className="mt-4 space-y-3 rounded-lg border border-border p-3 text-sm">
            <p>Mentor: {workspace.members.find(m=>m.role==="MENTOR"&&m.isPrimary)?.displayName??
              workspace.members.find(m=>m.role==="MENTOR")?.displayName??"Not assigned"}</p>
            <p>Due date: <strong>{workspace.project.dueLabel??workspace.project.endDate??"No due date"}</strong></p>
            {workspace.project.phase?<p>Phase: {workspace.project.phase}</p>:null}
            <div className="flex flex-wrap gap-3">
              <Link href={"/mentor/projects/"+workspace.project.id+"?tab=board"}
                className="min-h-10 font-semibold text-primary-text underline">
                {workspace.project.nextAction??"Next step · Open the Board"} →
              </Link>
            </div>
            {workspace.project.blocker||workspace.tasks.some(t=>t.status==="BLOCKED")?
              <div role="status" className="rounded-lg border border-warning-border bg-warning-subtle p-3">
                <p className="font-semibold">Requires attention</p>
                <p className="mt-1 whitespace-pre-wrap">{workspace.project.blocker||
                  workspace.tasks.filter(t=>t.status==="BLOCKED").length+" blocked tasks"}</p>
                <Link href={"/mentor/projects/"+workspace.project.id+"?tab=board&lane=BLOCKED"}
                  className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Open blocked work</Link>
              </div>:null}
          </section>:null}
          {workspace.project.summary ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">{workspace.project.summary}</p>
          ) : null}
        </section>
      ) : null}

      {show("team") ? <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              {mode==="ADMIN"?"Project people":"Project team"}
            </h2>
            {mode!=="ADMIN"?<p className="mt-1 text-sm text-body">
              See who is assigned, what role they play, and how the project is staffed.
              {" "}{workspace.members.length} member(s)
            </p>:null}
          </div>
          {mode === "ADMIN" && !readOnly ? (
            <>
              <Link href={(backHref.startsWith("/college/") ? "/college/projects" : "/admin/projects") +
                "/reassign-mentor?projectId=" + encodeURIComponent(workspace.project.id)}
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
                Reassign mentor
              </Link>
              <CollegeProjectMentorDialog projectId={workspace.project.id} collegeId={workspace.project.collegeId}/>
            </>
          ) : null}
          {mode === "ADMIN" && !readOnly && !workspace.project.teamGroupId ? (
            <>
              <CollegeProjectStudentRosterDialog projectId={workspace.project.id}
                expectedUpdatedAt={workspace.project.updatedAt.toISOString()}/>
              <AddProjectMemberControl projectId={workspace.project.id}/>
            </>
          ) : null}
        </div>
        {mode==="MENTOR" && mentorWorkspaceMissingPrimaryMentor(workspace.project.status,workspace.members) ? (
          <p role="status" className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">
            No primary Mentor is recorded in the current Project roster.
            Team staffing changes remain a College Admin action.
          </p>
        ) : null}
        {mode==="MENTOR" ? (() => {
          const facts=workspace.mentorEvidence.team;
          return <p className="text-sm text-body">
            Current recorded roster: {facts.learners} Learner{facts.learners===1?"":"s"} ·
            {" "}{facts.mentors} Mentor{facts.mentors===1?"":"s"} ·
            {" "}{facts.primaryMentors} primary Mentor assignment{facts.primaryMentors===1?"":"s"}
          </p>;
        })() : null}
        {workspace.project.teamGroupId ? (
          <p className="rounded-lg border border-border bg-surface p-3 text-sm text-body">
            Learner assignments in this workspace come from its managed class team.
            Only College Admin or Super Admin may change team membership in the class team workspace;
            mentors can review Project work but cannot edit team membership.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mode==="MENTOR"?workspace.mentorRoster.map(member=>{
            const active=member.endedAt===null && member.memberStatus==="ACTIVE" &&
              member.accountStatus==="ACTIVE";
            const linkedIn=member.role==="MENTOR"?safeProjectExternalHref(member.linkedIn):null;
            return <article key={member.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{member.displayName??"Unnamed member"}</p>
                  <p className="mt-1 text-xs text-body">{member.roleLabel?.trim()||label(member.role)}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge tone={active?"success":"neutral"}>{active?"Active":"Inactive"}</StatusBadge>
                  {member.role==="MENTOR"?<StatusBadge tone="info">{member.isPrimary?"Primary mentor":"Mentor"}</StatusBadge>:null}
                </div>
              </div>
              {member.role==="MENTOR"?<div className="mt-3 space-y-2 text-sm text-body">
                <p className="font-semibold text-foreground">{member.academicTitle?.trim()||"Project mentor"}</p>
                {member.bio?<p className="whitespace-pre-wrap break-words">{member.bio}</p>:
                  <p className="text-xs">No mentor bio yet. Update your faculty profile to introduce your role.</p>}
                {linkedIn?<a href={linkedIn} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center text-primary-text underline">LinkedIn profile ↗</a>:null}
              </div>:null}
            </article>;
          }):null}
          {mode!=="MENTOR"?workspace.members.map((member) => (
            <article
              key={member.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 font-semibold text-foreground">
                    {member.displayName ??
                      "Unnamed member"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.roleLabel ??
                      label(member.role)}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    member.role === "MENTOR"
                      ? "info"
                      : "neutral"
                  }
                >
                  {member.role === "MENTOR" &&
                  member.isPrimary
                    ? "Primary mentor"
                    : label(member.role)}
                </StatusBadge>
              </div>
              {mode === "ADMIN" && !readOnly && (!workspace.project.teamGroupId || member.role !== "LEARNER") ? (
                <ProjectMemberActions
                  projectId={workspace.project.id}
                  member={{
                    id: member.id,
                    role: member.role,
                    isPrimary: member.isPrimary,
                    displayName: member.displayName,
                  }}
                />
              ) : null}
            </article>
          )):null}
        </div>
      </section> : null}

      {show("sprints") || show("tasks") ? <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            {mode==="ADMIN"?"Execution":"Releases and Sprints"}
          </h2>
          {mentorReviewHref ? <Link href={mentorReviewHref}
            className="mt-2 inline-flex min-h-10 items-center rounded-md border border-primary px-3 text-sm font-semibold text-primary-text">
            Review submission
          </Link> : null}
          {mode==="ADMIN"?<p className="mt-1 text-sm text-body">Release and sprint execution records.</p>:null}
          {mode!=="LEARNER"&&!readOnly?
            <div id="mentor-project-add-release" className="scroll-mt-24">
              <MentorReleaseEditor projectId={workspace.project.id}/>
            </div>:null}
          {mode==="MENTOR"&&workspace.releases.length===0?
            <div role="status" className="mt-2 rounded-md border border-border p-4 text-sm text-body">
              <p>No sprints yet. Add the sprints this project should be measured against.</p>
              {readOnly?
                <p className="mt-2">This workspace is read-only, so sprints cannot be added.</p>:
                <p className="mt-2">First <a href="#mentor-project-add-release"
                  className="font-semibold text-primary-text underline">add a release</a>,
                  then use Add sprint inside that release. The Board and Task Allocation will appear here.</p>}
            </div>:null}
        </div>
        {mode==="LEARNER"?<div role="status" className="rounded-lg border border-border p-3 text-sm text-body">
          {(()=>{
            const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",
              year:"numeric",month:"2-digit",day:"2-digit"}).format(renderTime);
            const rollup=learnerSprintRollup(workspace.sprints,workspace.tasks,today);
            return <>Sprints completed {rollup.completed} of {rollup.total}
              {" · "}{rollup.overdue} Overdue</>;
          })()}
        </div>:null}
        {mode==="LEARNER"&&workspace.releases.length>0?
          <nav aria-label="Release roadmap" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {workspace.releases.map(release=><a key={release.id}
              href={"#project-release-"+release.id}
              aria-current={release.status==="ACTIVE"?"step":undefined}
              className={"min-h-11 rounded-md border px-3 py-2 text-sm font-semibold "+
                (release.status==="SHIPPED"?"border-success-border bg-success-subtle text-success-text":
                  release.status==="ACTIVE"?"border-primary bg-primary-subtle text-primary-text":
                  "border-border bg-surface text-body")}>
              {release.title} · {label(release.status)}
            </a>)}
          </nav>:null}
        <div className="space-y-4">
          {workspace.releases.map((release) => (
            <article
              key={release.id}
              id={"project-release-"+release.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                    Release {release.sequence + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {release.title}
                  </h3>
                  {mode==="MENTOR"?<p className="mt-2 text-xs font-semibold text-body">
                    {(sprintsByRelease.get(release.id)??[]).filter(s=>s.status==="COMPLETED").length}
                    {" "}of {(sprintsByRelease.get(release.id)??[]).length} sprints complete ·
                    {" "}{mentorEstimateLabel(workspace.tasks.filter(t=>t.sprintId!==null&&
                      (sprintsByRelease.get(release.id)??[]).some(s=>s.id===t.sprintId))
                      .reduce((sum,t)=>sum+(t.estimatePoints??0),0),workspace.project.estimationUnit)} ·
                    {" "}{(sprintsByRelease.get(release.id)??[]).every(s=>s.status==="COMPLETED")?
                      "Ready to ship":"Work remaining"}
                  </p>:null}
                  {release.description ? (
                    <p className="mt-1 text-sm leading-6 text-body">
                      {release.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={tone(release.status)}>
                    {label(release.status)}
                  </StatusBadge>
                  {mode!=="LEARNER"&&!readOnly?<MentorReleaseEditor
                    projectId={workspace.project.id} release={release}
                    linkedSprints={(sprintsByRelease.get(release.id)??[]).length}/>:null}
                  {mode !== "LEARNER" && !readOnly && release.status !== "SHIPPED" ? (
                    <MentorSprintCreate projectId={workspace.project.id}
                      releaseId={release.id}
                      releases={workspace.releases.map(item=>({
                        id:item.id,title:item.title,status:item.status,
                      }))} />
                  ) : null}
                  {mode !== "LEARNER" && !readOnly ? (
                    <ReleaseLifecycleActions
                      projectId={workspace.project.id}
                      releaseId={release.id}
                      status={release.status}
                      expectedUpdatedAt={release.updatedAt.toISOString()}
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(sprintsByRelease.get(release.id) ??
                  []).map((sprint) => (
                  <section
                    key={sprint.id}
                    className="rounded-lg border border-border bg-[var(--lms-neutral-50)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-sm font-semibold text-foreground">
                          Sprint {sprint.sequence + 1} ·{" "}
                          {sprint.title}
                        </p>
                        {mode==="LEARNER"?(()=>{
                          const progress=learnerSprintProgress(sprint,workspace.tasks);
                          return <p className="mt-2 text-xs text-body"
                            aria-label={sprint.title+": "+progress.percentage+"% complete"}>
                            {progress.percentage}% complete · {progress.completed}/{progress.total} tasks
                            {" · "}Due {sprint.dueDate??sprint.endDate??"not set"}
                          </p>;
                        })():null}
                        {sprint.description ? (
                          <p className="mt-1 text-xs leading-5 text-body">
                            {sprint.description}
                          </p>
                        ) : null}
                        {mode==="MENTOR" ? (() => {
                          const facts=workspace.mentorEvidence.tasksBySprint[sprint.id]??mentorSprintTaskFacts([]);
                          return <p className="mt-2 text-xs text-body">
                            Tasks: {facts.done}/{facts.total} done · {facts.inReview} In review · {facts.blocked} Blocked
                            {" · "}Completion: {facts.completionPercent===null?"No tasks yet":facts.completionPercent+"%"}
                          </p>;
                        })() : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={tone(sprint.status)}
                        >
                          {label(sprint.status)}
                        </StatusBadge>
                        {mode!=="LEARNER"&&!readOnly&&sprint.status==="PLANNED"&&release.status!=="SHIPPED"?
                          <MentorSprintDeleteControl projectId={workspace.project.id}
                            sprintId={sprint.id} title={sprint.title}
                            taskCount={(tasksBySprint.get(sprint.id)??[]).length}
                            updatedAt={sprint.updatedAt.toISOString()}/>:null}
                        {mode !== "LEARNER" && !readOnly ? <>
                          {["PLANNED","ACTIVE"].includes(sprint.status) &&
                            release.status !== "SHIPPED" ? (
                              <MentorSprintDetailsEdit
                                projectId={workspace.project.id}
                                sprintId={sprint.id}
                                title={sprint.title}
                                description={sprint.description}
                                updatedAt={sprint.updatedAt.toISOString()}
                              estimationUnit={workspace.project.estimationUnit}
                                goal={sprint.goal}
                                definitionOfDone={sprint.definitionOfDone}
                                startDate={sprint.startDate}
                                endDate={sprint.endDate}
                                dueDate={sprint.dueDate}
                                status={sprint.status}
                              />
                            ) : null}
                          {mode === "MENTOR" &&
                          ["PLANNED","ACTIVE"].includes(sprint.status) &&
                          release.status !== "SHIPPED" ? (
                            <MentorTaskCreate
                              projectId={workspace.project.id}
                              sprintId={sprint.id}
                              updatedAt={sprint.updatedAt.toISOString()}
                              learners={workspace.members.filter(m=>m.role==="LEARNER").map(m=>({membershipId:m.membershipId,displayName:m.displayName}))}
                              sprints={workspace.sprints.filter(item=>item.status!=="COMPLETED"
                                && workspace.releases.some(release=>release.id===item.releaseId
                                  && release.status!=="SHIPPED")).map(item=>({
                                id:item.id,title:item.title,status:item.status,
                                updatedAt:item.updatedAt.toISOString(),
                              }))}
                            />
                          ) : null}
                          {mode === "MENTOR" ? (
                            <MentorSprintTransition
                              projectId={workspace.project.id}
                              sprintId={sprint.id}
                              status={sprint.status}
                              releaseStatus={release.status}
                              updatedAt={sprint.updatedAt.toISOString()}
                            />
                          ) : (
                            <SprintLifecycleActions
                              projectId={workspace.project.id}
                              sprintId={sprint.id}
                              status={sprint.status}
                              releaseStatus={release.status}
                            />
                          )}
                        </> : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {mode==="MENTOR" && mentorSprintEmptyWorkNotice(sprint.status,tasksBySprint.get(sprint.id)??[]) ? (
                        <p role="status" className="rounded-lg border border-border bg-surface p-3 text-xs text-body">
                          {mentorSprintEmptyWorkNotice(sprint.status,tasksBySprint.get(sprint.id)??[])}
                        </p>
                      ) : null}
                      {(tasksBySprint.get(sprint.id) ??
                        []).map((task) => {
                        const attempts =
                          taskSubmissions.get(
                            task.id,
                          ) ?? [];
                        const latestAttempt =
                          attempts.at(-1) ?? null;
                        const taskFacts = projectTaskVisibleFacts(task,
                          workspace.members.find(member =>
                            member.membershipId === task.assigneeMembershipId)?.displayName ?? null);
                        return (
                          <div
                            key={task.id}
                            id={"mentor-task-"+task.id}
                            className="rounded-lg border border-border bg-surface px-3 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="m-0 text-sm font-semibold text-foreground">
                                  {task.title}
                                </p>
                                {task.description ? (
                                  <p className="mt-1 text-xs leading-5 text-body">
                                    {task.description}
                                  </p>
                                ) : null}
                                {task.approach ? <section className="mt-2 text-xs text-body">
                                  <h4 className="font-semibold">Approach</h4>
                                  <p className="whitespace-pre-wrap break-words">{task.approach}</p>
                                </section>:null}
                                {showMentorTaskCriteria(mode,task.acceptanceCriteria) ? (
                                  <details className="mt-2 rounded-lg border border-border bg-surface-subtle px-3 py-2">
                                    <summary className="min-h-9 cursor-pointer py-1 text-xs font-semibold text-primary-text">
                                      Acceptance criteria
                                    </summary>
                                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-body">
                                      {learnerTaskCriteriaPreview(task.acceptanceCriteria)}
                                    </p>
                                  </details>
                                ) : null}
                                {mode==="MENTOR" && mentorTaskReviewEvidence(task.status,latestAttempt)==="REVIEW_PENDING" ? (
                                  <p role="status" className="mt-2 text-xs font-semibold text-primary-text">
                                    Submitted attempt v{latestAttempt?.version} is waiting for Mentor review.
                                  </p>
                                ) : null}
                                {mode==="MENTOR" && latestAttempt ? (
                                  <Link href={mentorTaskFeedbackHref(workspace.project.id,task.id)}
                                    className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-primary-text underline">
                                    Review recorded task feedback →
                                  </Link>
                                ) : null}
                                {latestAttempt ? (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Latest review attempt v
                                    {latestAttempt.version} ·{" "}
                                    {label(
                                      latestAttempt.status,
                                    )}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge tone="neutral">
                                  {label(task.priority)}
                                </StatusBadge>
                                <StatusBadge
                                  tone={tone(task.status)}
                                >
                                  {label(task.status)}
                                </StatusBadge>
                              </div>
                            </div>
                            <dl className="mt-3 grid gap-2 text-xs text-body sm:grid-cols-2">
                              <div><dt className="font-semibold">Assignee</dt><dd>{taskFacts.assignee}</dd></div>
                              <div><dt className="font-semibold">Due date</dt>
                                <dd>{taskFacts.dueDate}
                                  {projectTaskDueState(task.dueDate,task.status,renderTime) ?
                                    <span className="ml-2 font-semibold text-warning-text">
                                      {projectTaskDueState(task.dueDate,task.status,renderTime)}
                                    </span> : null}
                                </dd>
                              </div>
                              {mode==="MENTOR"?<div>
                                <dt className="font-semibold">Sprint</dt><dd>{sprint.title}</dd>
                              </div>:null}
                              <div><dt className="font-semibold">Estimate</dt><dd>{mentorEstimateLabel(task.estimatePoints,workspace.project.estimationUnit)}</dd></div>
                              <div><dt className="font-semibold">Task type</dt><dd>{taskFacts.taskType}</dd></div>
                              {taskFacts.blockerReason ? <div className="sm:col-span-2">
                                <dt className="font-semibold">Blocker note</dt>
                                <dd className="whitespace-pre-wrap break-words">{taskFacts.blockerReason}</dd>
                              </div> : null}
                              {latestAttempt?.submissionUrl && safeHttpHref(latestAttempt.submissionUrl) ?
                                <div className="sm:col-span-2"><dt className="font-semibold">Submission</dt>
                                  <dd><a target="_blank" rel="noreferrer"
                                    href={safeHttpHref(latestAttempt.submissionUrl)!}
                                    className="text-primary-text underline">Open submission</a></dd>
                                </div> : null}
                            </dl>
                            {mode === "LEARNER" &&
                            !readOnly &&
                            sprint.status === "ACTIVE" &&
                            task.status !== "DONE" &&
                            task.status !== "IN_REVIEW" ? (
                              <div className="mt-3">
                                <ProjectTaskSubmissionControl
                                  projectId={workspace.project.id}
                                  taskId={task.id}
                                />
                              </div>
                            ) : null}
                            {mode === "LEARNER" && !readOnly &&
                              sprint.status === "ACTIVE" &&
                              ["TODO", "IN_PROGRESS", "BLOCKED"].includes(task.status) &&
                              task.assigneeMembershipId === currentMembershipId ? (
                                <LearnerTaskProgressControl
                                  projectId={workspace.project.id} taskId={task.id}
                                  status={task.status} blockerReason={task.blockerReason}
                                  updatedAt={task.updatedAt.toISOString()}
                                  canMoveUp={(tasksBySprint.get(sprint.id) ?? [])
                                    .some(other => other.sequence < task.sequence)}
                                  canMoveDown={(tasksBySprint.get(sprint.id) ?? [])
                                    .some(other => other.sequence > task.sequence)}
                                />
                              ) : null}
                            <ProjectTaskComments projectId={workspace.project.id}
                              taskId={task.id} updatedAt={task.updatedAt.toISOString()}
                              canPost={!readOnly}/>
                            {mode !== "LEARNER" && !readOnly ? (
                              <div className="mt-3 flex flex-wrap items-end gap-2">
                                {["PLANNED","ACTIVE"].includes(sprint.status) &&
                                  release.status !== "SHIPPED" &&
                                  task.status !== "DONE" &&
                                  task.status !== "IN_REVIEW" ? (
                                    <MentorTaskDetailsEdit
                                      projectId={workspace.project.id}
                                      taskId={task.id}
                                      title={task.title}
                                      description={task.description}
                                      approach={task.approach}
                                      acceptanceCriteria={task.acceptanceCriteria}
                                      priority={task.priority}
                                      taskType={task.taskType}
                                      estimatePoints={task.estimatePoints}
                                      dueDate={task.dueDate}
                                      blockerReason={task.blockerReason}
                                      updatedAt={task.updatedAt.toISOString()}
                                    />
                                  ) : null}
                                {["PLANNED","ACTIVE"].includes(sprint.status) &&
                                 release.status !== "SHIPPED" &&
                                 task.status !== "DONE" && task.status !== "IN_REVIEW" ? (
                                  <ProjectTaskAssigneeControl
                                    projectId={workspace.project.id}
                                    taskId={task.id}
                                    assigneeMembershipId={task.assigneeMembershipId}
                                    updatedAt={task.updatedAt.toISOString()}
                                    learners={workspace.members.filter(member=>member.role==="LEARNER").map(member=>({
                                      membershipId:member.membershipId,displayName:member.displayName,
                                    }))}
                                  />
                                ) : null}
                                {mode === "MENTOR" ? (
                                  <MentorTaskStatusTransition
                                    projectId={workspace.project.id}
                                    taskId={task.id}
                                    status={task.status}
                                    sprintStatus={sprint.status}
                                    blockerReason={task.blockerReason}
                                    updatedAt={task.updatedAt.toISOString()}
                                  />
                                ) : (
                                  <TaskLifecycleActions
                                    projectId={workspace.project.id}
                                    taskId={task.id}
                                    status={task.status}
                                    sprintStatus={sprint.status}
                                  />
                                )}
                                {latestAttempt?.status ===
                                  "SUBMITTED" &&
                                task.status ===
                                  "IN_REVIEW" ? (
                                  <TaskReviewActions
                                    projectId={workspace.project.id}
                                    taskId={task.id}
                                    submissionId={latestAttempt.id}
                                    mode={mode}
                                    expectedUpdatedAt={latestAttempt.updatedAt.toISOString()}
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section> : null}

      {show("delivery") ? <section className="space-y-3">
        {mode === "LEARNER" && workspace.members.filter(member => member.role === "LEARNER").length > 1 ? (
          <div role="status" className="rounded-lg border border-border bg-surface-subtle p-3 text-sm text-body">
            Team submission: this final delivery is shared with everyone on your project team.
            Edits and submission status are visible to all team members.
          </div>
        ) : null}
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Final submission
          </h2>

        </div>
        {mode==="MENTOR" && workspace.mentorEvidence.latestDelivery ? (
          <p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">
            Latest recorded delivery: version {workspace.mentorEvidence.latestDelivery?.version}
            {" · "}{workspace.mentorEvidence.latestDelivery?.status}.
            Historic versions remain available below.
          </p>
        ) : null}
        {workspace.finalDelivery.submissions.length ===
        0 ? (
          <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
            Not submitted
          </div>
        ) : (
          <div className="space-y-3">
            {workspace.finalDelivery.submissions.map(
              (submission) => {
                const review =
                  reviewsBySubmission.get(
                    submission.id,
                  ) ?? null;
                const evaluation =
                  evaluationsBySubmission.get(
                    submission.id,
                  ) ?? null;
                const source =
                  safeHttpHref(
                    submission.sourceUrl,
                  );
                const demo = safeHttpHref(
                  submission.demoUrl,
                );

                return (
                  <article
                    key={submission.id}
                    className="rounded-xl border border-border bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                          Version {submission.version}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                          {submission.summary}
                        </p>
                      </div>
                      <StatusBadge
                        tone={tone(
                          submission.status,
                        )}
                      >
                        {label(submission.status)}
                      </StatusBadge>
                    </div>

                    {mode !== "LEARNER" ? (
                      <dl className="mt-3 grid gap-2 text-xs text-body sm:grid-cols-2">
                        <div><dt className="font-semibold">Submission type</dt>
                          <dd>{submission.attachments.some(item=>(item as {kind?:string}|null)?.kind==="FILE") ? "File upload" :
                            submission.sourceUrl && submission.demoUrl ? "Source + demo" :
                            submission.sourceUrl || submission.demoUrl ? "Link" : "Text"}</dd></div>
                        <div><dt className="font-semibold">Submitted by</dt>
                          <dd>{workspace.members.find(member =>
                            member.membershipId === submission.submittedByMembershipId
                          )?.displayName ?? "Not submitted"}</dd></div>
                        <div><dt className="font-semibold">Submitted at</dt>
                          <dd>{formatDateTime(submission.submittedAt)}</dd></div>
                        <div><dt className="font-semibold">Revisions</dt>
                          <dd>{Math.max(0, submission.version - 1)}</dd></div>
                      </dl>
                    ) : null}
                    {mode !== "LEARNER" && submission.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-body">
                        {submission.notes}
                      </p>
                    ) : null}
                    {mode !== "LEARNER" && submission.attachments.length ? (
                      <section aria-label="Additional evidence" className="mt-3 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Additional evidence</h3>
                        {submission.attachments.map((item, index) => {
                          if (!item || typeof item !== "object") return null;
                          const row = item as Record<string, unknown>;
                          const name = typeof row.name === "string" ? row.name : "Evidence";
                          const href = typeof row.url === "string" ? safeHttpHref(row.url) : null;
                          return <p key={index} className="text-xs text-body">
                            {href && row.kind === "LINK" ?
                              <a href={href} rel="noopener noreferrer" target="_blank"
                                className="text-primary-text hover:underline">Open link · {name}</a> :
                              row.kind === "FILE" && typeof row.fileId === "string"
                                ? <ProjectDeliveryEvidenceDownload projectId={workspace.project.id}
                                    fileId={row.fileId} name={name}/>
                                : <span>File · {name} (not available)</span>}
                          </p>;
                        })}
                      </section>
                    ) : null}

                    {source || demo ? (
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                        {source ? (
                          <a
                            href={source}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-text hover:text-primary-hover"
                          >
                            Open source ↗
                          </a>
                        ) : null}
                        {demo ? (
                          <a
                            href={demo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-text hover:text-primary-hover"
                          >
                            Open demo ↗
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {review ? (
                      <div className="mt-4 rounded-lg bg-muted p-3">
                        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Review · {label(review.decision)}
                        </p>
                        {review.feedback ? (
                          <p className="mt-1 text-sm leading-6 text-body">
                            {review.feedback}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {mode!=="LEARNER"?<details className="mt-3 rounded-lg border border-border p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-primary-text">
                        Submission history
                      </summary>
                      <ul className="mt-2 space-y-2 text-xs text-body">
                        {workspace.activity.filter(event=>event.subjectId===submission.id&&
                          event.eventType.includes("delivery")).map(event=>
                            <li key={event.id} className="border-l-2 border-border pl-2">
                              {event.summary} · {event.actorDisplayName??"System"} · {formatDateTime(event.occurredAt)}
                            </li>)}
                        {submission.reopenedAt?<li>Reopened · {formatDateTime(submission.reopenedAt)}</li>:null}
                        {submission.lockedAt?<li>Locked · {formatDateTime(submission.lockedAt)}</li>:null}
                      </ul>
                    </details>:null}
                    {mode === "ADMIN" && !readOnly &&
                      (submission.status === "SUBMITTED" || submission.status === "APPROVED") ? (
                      <ProjectAdminSubmissionReview projectId={workspace.project.id}
                        submissionId={submission.id} status={submission.status}
                        locked={Boolean(submission.lockedAt)}
                        projectStatus={workspace.project.status}/>
                    ) : null}
                    {mode==="MENTOR"&&!readOnly?<MentorDeliveryLockControl
                      projectId={workspace.project.id} submissionId={submission.id}
                      status={submission.status} lockedAt={submission.lockedAt}
                      updatedAt={submission.updatedAt}/>:null}
                    {mode === "MENTOR" && !readOnly &&
                      submission.status === "SUBMITTED" ? (
                      <div className="mt-3">
                        <FinalReviewControl projectId={workspace.project.id}
                          submissionId={submission.id} mode={mode}
                          expectedUpdatedAt={submission.updatedAt.toISOString()}/>
                      </div>
                    ) : null}

                    {mode !== "LEARNER" &&
                    !readOnly &&
                    submission.status ===
                      "APPROVED" &&
                    !evaluation ? (
                      <div className="mt-3">
                        <ProjectEvaluationControl
                          projectId={workspace.project.id}
                          submissionId={submission.id}
                        />
                      </div>
                    ) : null}

                    {mode !== "LEARNER" &&
                     workspace.project.status === "ACTIVE" &&
                     submission.status === "APPROVED" &&
                     !evaluation &&
                     workspace.readiness.finalSubmission.latest?.id === submission.id &&
                     !workspace.readiness.finalSubmission.reopened ? (
                      <div className="mt-3">
                        <ProjectDeliveryReopenControl projectId={workspace.project.id}
                          submissionId={submission.id} expectedUpdatedAt={submission.updatedAt.toISOString()} />
                      </div>
                    ) : null}

                    {evaluation ? (
                      <div className="mt-3 rounded-lg bg-[var(--lms-success-subtle)] p-3">
                        <p className="m-0 text-sm font-semibold text-success">
                          Evaluation ·{" "}
                          {evaluation.totalScore}/
                          {evaluation.maxScore}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {show("resources") ? <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Resources
              </h2>
              {mode==="LEARNER"?<p aria-label="Resource counts" className="mt-1 text-sm text-body">
                {workspace.resources.filter(resource=>resource.status!=="ARCHIVED").length} active resources ·
                {" "}{workspace.resources.filter(resource=>resource.required&&resource.status!=="ARCHIVED").length} required
              </p>:null}
            </div>
            {!readOnly && (mode !== "LEARNER" || workspace.project.status === "ACTIVE") ? (
              <CreateProjectResourceControl
                projectId={workspace.project.id}
                isLearner={mode === "LEARNER"}
                sprints={workspace.sprints.map(item=>({id:item.id,label:item.title}))}
                tasks={workspace.tasks.map(item=>({id:item.id,label:item.title}))}
              />
            ) : null}
          </div>
          <ProjectResourceList projectId={workspace.project.id} rows={workspace.resources}
            mode={mode} readOnly={readOnly}
            sprints={workspace.sprints.map(item=>({id:item.id,label:item.title}))}
            tasks={workspace.tasks.map(item=>({id:item.id,label:item.title}))}/>
          <ProjectResourceFilesSection
            projectId={workspace.project.id}
            mode={mode}
            status={workspace.project.status}
            currentMembershipId={currentMembershipId}
          />
        </section> : null}

        {show("meetings") ? <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Meetings
              </h2>
              <p className="mt-1 text-sm text-body">
                {mode==="LEARNER"?"Upcoming meetings and recent history.":"Requested, scheduled and completed Project conversations."}
              </p>
            </div>
            {!readOnly && mode === "LEARNER" ? (
              <RequestProjectMeetingControl
                projectId={workspace.project.id}
              />
            ) : !readOnly ? (
              <ScheduleProjectMeetingControl
                projectId={workspace.project.id}
                projectUpdatedAt={workspace.project.updatedAt}
                sprints={workspace.sprints.map(
                  (sprint) => ({
                    id: sprint.id,
                    label: sprint.title,
                  }),
                )}
                tasks={workspace.tasks.flatMap(
                  (task) => task.sprintId ? [{
                    id: task.id,
                    label: task.title,
                    sprintId: task.sprintId,
                  }] : [],
                )}
              />
            ) : null}
          </div>
          {mode==="MENTOR" && workspace.meetings.length ? (() => {
            const upcoming=workspace.meetings.filter(m=>(m.status==="SCHEDULED"||m.status==="RESCHEDULED")&&new Date(m.endsAt)>renderTime)
              .sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime());
            return <section aria-label="Upcoming project meetings" className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold">Next meeting</h3>
              {upcoming[0]?<p className="mt-1 text-sm">
                {upcoming[0].title} · {formatDateTime(upcoming[0].startsAt)}
                {upcoming[0].meetingType?" · "+label(upcoming[0].meetingType):""}
              </p>:
                <p className="mt-1 text-sm text-muted-foreground">No upcoming meeting.</p>}
              {upcoming.length>1?<details className="mt-2 text-sm">
                <summary className="cursor-pointer font-semibold text-primary-text">Also scheduled ({upcoming.length-1})</summary>
                <ul className="mt-2 space-y-1">{upcoming.slice(1).map(m=>
                  <li key={m.id}>{m.title} · {formatDateTime(m.startsAt)}
                    {m.meetingType?" · "+label(m.meetingType):""}</li>)}</ul>
              </details>:null}
              <MentorMeetingHistory meetings={workspace.meetings
                .filter(m=>m.status==="COMPLETED"||m.status==="CANCELLED"||
                  ((m.status==="SCHEDULED"||m.status==="RESCHEDULED")&&new Date(m.endsAt)<=renderTime))
                .sort((a,b)=>new Date(b.startsAt).getTime()-new Date(a.startsAt).getTime())
                .map(m=>({id:m.id,title:m.title,
                  startsAt:new Date(m.startsAt).toISOString(),
                  status:label(mentorMeetingDisplayStatus(m.status,m.endsAt,renderTime)),
                }))}/>
            </section>;
          })():null}
          {mode==="LEARNER"&&workspace.meetings.length>0?<h3 className="text-sm font-semibold">
            Meeting history
          </h3>:null}
          <div className="space-y-3">
            {workspace.meetings.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
                {mode==="LEARNER"?"No meetings yet.":"No meetings yet."}
              </div>
            ) : (
              workspace.meetings.map((meeting) => {
                const href = safeHttpHref(
                  meeting.meetingUrl,
                );
                return (
                  <article
                    key={meeting.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 font-semibold text-foreground">
                          {meeting.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(meeting.startsAt)} – {formatDateTime(meeting.endsAt)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Meeting zone: {meeting.timeZone}
                        </p>
                      </div>
                      <StatusBadge
                        tone={tone(mentorMeetingDisplayStatus(meeting.status, meeting.endsAt, renderTime))}
                      >
                        {label(mentorMeetingDisplayStatus(meeting.status, meeting.endsAt, renderTime))}
                      </StatusBadge>
                    </div>
                    {meeting.status==="REQUESTED"? (
                      <p className="mt-2 text-xs font-semibold text-warning-text">
                        Waiting for a mentor response
                      </p>
                    ) : null}
                    {meeting.requestedByMembershipId ? (
                      <p className="mt-2 text-xs text-body">
                        Organised by {" "}
                        {workspace.members.find(member=>member.membershipId===meeting.requestedByMembershipId)?.displayName??"Project member"}
                      </p>
                    ) : null}
                    {meeting.agenda ? (
                      <p className="mt-2 text-sm leading-6 text-body">
                        {meeting.agenda}
                      </p>
                    ) : null}
                    {meeting.outcome ? (
                      <p className="mt-2 rounded-lg bg-muted p-3 text-sm leading-6 text-body">
                        Outcome: {meeting.outcome}
                      </p>
                    ) : null}
                    {mode==="MENTOR"?(()=>{
                      const detail=mentorMeetingFacilitationSchema.parse(meeting.facilitation??{});
                      const hasDetail=Boolean(detail.notes||detail.actionItems||detail.wentWell||
                        detail.improve||detail.nextTime||detail.followUpAt||detail.followUpNotes);
                      return hasDetail?<details className="mt-2 rounded-md border border-border p-3 text-sm">
                        <summary className="cursor-pointer font-semibold text-foreground">Meeting notes and follow-up</summary>
                        {([
                          ["Notes",detail.notes],["Action items",detail.actionItems],
                          ["What went well?",detail.wentWell],["What could improve?",detail.improve],
                          ["What to try next?",detail.nextTime],["Follow-up notes",detail.followUpNotes],
                        ] as const).filter(([,value])=>Boolean(value)).map(([label,value])=>
                          <p key={label} className="mt-2 whitespace-pre-wrap break-words">
                            <strong>{label}: </strong>{value}</p>)}
                        {detail.followUpAt?<p className="mt-2">
                          Follow-up: {formatDateTime(new Date(detail.followUpAt))}
                          {" · "}{label(detail.followUpStatus)}</p>:null}
                      </details>:null;
                    })():null}
                    {mode==="MENTOR"? (
                      <Link
                        href={"/mentor/projects/"+encodeURIComponent(workspace.project.id)+
                          "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}
                        className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
                        {meeting.outcome?"View notes":"Add notes"}
                      </Link>
                    ) : null}
                    {href && meeting.status!=="CANCELLED" && meeting.status!=="COMPLETED" && mentorMeetingDisplayStatus(meeting.status,meeting.endsAt,renderTime)!=="MISSED" ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
                      >
                        Join meeting ↗
                      </a>
                    ) : null}
                    {mode !== "LEARNER" &&
                    !readOnly &&
                    (meeting.status === "REQUESTED" || meeting.status === "DRAFT" ||
                      meeting.status === "SCHEDULED" || meeting.status === "RESCHEDULED") && mentorMeetingDisplayStatus(meeting.status,meeting.endsAt,renderTime)!=="MISSED" ? (
                      <div className="mt-3">
                        <ScheduleProjectMeetingControl
                          projectId={workspace.project.id}
                          projectUpdatedAt={workspace.project.updatedAt}
                          meeting={meeting}
                          sprints={workspace.sprints.map(
                            (sprint) => ({
                              id: sprint.id,
                              label: sprint.title,
                            }),
                          )}
                          tasks={workspace.tasks.filter(task=>task.sprintId!==null).map(
                            (task) => ({
                              id: task.id,
                              label: task.title,
                              sprintId: task.sprintId!,
                            }),
                          )}
                        />
                      </div>
                    ) : null}
                    {!readOnly && mentorMeetingDisplayStatus(meeting.status,meeting.endsAt,renderTime)!=="MISSED" ? (
                      <ProjectMeetingTransitionActions
                        projectId={workspace.project.id}
                        meeting={meeting}
                        mode={mode}
                        currentMembershipId={
                          currentMembershipId
                        }
                      />
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section> : null}
      </div>

      {show("audit") ? (
        <section className="space-y-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              Activity
            </h2>
            <p className="mt-1 text-sm text-body">
              Task moves, sprint updates and resource changes from your project.
            </p>
          </div>

          {mode === "ADMIN" ? <Link href={"/admin/projects/audit?projectId=" + encodeURIComponent(workspace.project.id)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">View full project audit</Link> : null}
          <ProjectActivityFilteredList projectId={workspace.project.id} events={workspace.activity} now={new Date().toISOString()} resourceAudit={mode==="ADMIN"}/>


        </section>
      ) : null}
    </div>
  );
}
