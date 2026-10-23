import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { Disclosure } from "@/components/ui/disclosure";
import { mentorMeetingDisplayStatus } from "@/modules/projects/mentor-meeting-display-status";
import {mentorEstimateLabel} from "@/modules/projects/mentor-estimation-unit-model";
import {mentorMeetingFacilitationSchema} from "@/modules/projects/mentor-meeting-facilitation-model";
import { safeProjectExternalHref, showMentorTaskCriteria, mentorSprintTaskFacts, mentorSprintEmptyWorkNotice, mentorTaskReviewEvidence, mentorTaskFeedbackHref, mentorWorkspaceMissingPrimaryMentor } from "@/modules/projects/mentor-workspace-evidence-model";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProjectArchiveControl } from "./project-archive-control";
import { ProjectChangeTemplateControl } from "./project-change-template-control";
import { ProjectAdminSubmissionReview } from "./project-admin-submission-review";
import {CollegeProjectSummaryEditorFull} from "./college-project-summary-editor-full";
import {MentorProjectAboutEditor} from "./mentor-project-about-editor";
import {WorkspaceBriefEditor} from "./workspace-brief-editor";
import {parseWorkspaceBrief,workspaceBriefRequiresDeliverables} from "@/modules/projects/workspace-brief-model";
import { mentorAuthoredBrief, mentorReviewSubmissionHref } from "@/modules/projects/mentor-overview-presenter";
import { ProjectResourceFilesSection } from "./project-resource-files-section";
import { ProjectDeliveryEvidenceDownload } from "./project-delivery-evidence-download";
import {ProjectDeliveryReopenControl} from "./project-delivery-reopen-control";
import {ProjectDeliveryHistoryTimeline} from "./project-delivery-history-timeline";
import {groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {learnerSprintRollup,learnerSprintProgress} from "@/modules/projects/learner-sprint-progress-model";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricBar } from "@/components/ui/metric-bar";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { effectiveProjectSubmissionReady } from "@/modules/projects/readiness-override-model";
import { MentorSprintDetailsEdit } from "./mentor-sprint-details-edit";
import {mentorSprintPlanRevisionToken} from "@/modules/projects/mentor-sprint-details-model";
import {MentorSprintDeleteControl} from "./mentor-sprint-delete-control";
import {ProjectActivityFilteredList} from "./project-activity-filtered-list";
import { ProjectResourceAuditList } from "./project-resource-audit-list";
import {CollegeProjectMentorDialog} from "./college-project-mentor-dialog";
import {CollegeProjectStudentRosterDialog} from "./college-project-student-roster-dialog";
import {ProjectResourceList} from "./project-resource-list";
import {ProjectResourceLibraryEditor} from "./project-resource-library-editor";
import {projectResourceLibraryToken} from "@/modules/projects/project-resource-library-token";
import { ProjectRosterTable } from "./project-roster-table";
import {CollegeAdminWorkspaceTeamOverview} from "./college-admin-workspace-team-overview";
import { ProjectTeamRosterReconcile } from "./project-team-roster-reconcile";
import { ProjectSprintPlanEditor } from "./project-sprint-plan-editor";
import { ProjectSprintRowList } from "./project-sprint-row-list";
import { ProjectTaskPlanEditor } from "./project-task-plan-editor";
import {ProjectAdminTaskAdd} from "./project-admin-task-add";
import { projectTaskPlanToken } from "@/modules/projects/project-task-plan-token";
import type { ProjectTaskPlanRow } from "@/modules/projects/project-task-plan-model";
import {MentorDeliveryLockControl} from "./mentor-delivery-lock-control";
import { MentorSprintCreate, MentorSprintTransition } from "./mentor-sprint-write";
import {MentorReleaseEditor} from "./mentor-release-editor";
import {MentorMeetingHistory} from "./mentor-meeting-history";
import { ProjectMeetingPlanEditor } from "./project-meeting-plan-editor";
import { projectMeetingPlanToken } from "@/modules/projects/project-meeting-plan-token";
import { MentorTaskDetailsEdit } from "./mentor-task-details-edit";
import { ProjectTaskAssigneeControl } from "./project-task-assignee-control";
import {ProjectTaskComments} from "./project-task-comments";
import {ProjectTaskSubmissionOverview} from "./project-task-submission-overview";
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
import { AddProjectMemberControl } from "./project-team-controls";
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

export const PROJECT_WORKSPACE_SECTION_LABELS: Record<
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
  return <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-1 py-3">
    <p className="text-xs font-medium leading-5 text-body">{metricLabel}</p>
    <p className="mt-1 break-words text-xl font-semibold leading-7 tabular-nums text-[var(--lms-heading)]">{value}</p>
    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{detail}</p>
  </div>;
}


/** Format literal calendar dates without offset-induced day changes. */
function formatWorkspaceTarget(value: string | null | undefined) {
  if (!value) return "Not set";
  if (!new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$").test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return value;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(date);
}

/** Match the legacy read-first snapshot without overwriting execution-managed progress. */
function WorkspaceHealthSnapshot({ workspace, templateHref }: { workspace: Workspace; templateHref: string | null }) {
  const tasks = workspace.readiness.execution.tasks;
  const sprints = workspace.readiness.execution.sprints;
  // Legacy overall progress weighs every task and sprint equally. Only use the
  // editable fallback when the project has no plan items at all.
  const totalPlanItems = tasks.total + sprints.total;
  const progress = totalPlanItems > 0
    ? Math.round(100 * (tasks.done + sprints.completed) / totalPlanItems)
    : Math.max(0, Math.min(100, workspace.project.progressPercent ?? 0));
  const facts = [
    { label: "Team", value: workspace.members.length + " member" + (workspace.members.length === 1 ? "" : "s") },
    { label: "Tasks", value: tasks.total ? tasks.done + " / " + tasks.total + " done" : "No tasks yet" },
    { label: "Sprints", value: sprints.total ? sprints.completed + " / " + sprints.total + " done" : "No sprints yet" },
    { label: "Target", value: formatWorkspaceTarget(workspace.project.endDate ?? workspace.project.dueLabel) },
  ];
  return <section aria-label="Workspace health" className="border-b border-[var(--lms-canvas-border)] pb-5">
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Workspace health</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={tone(workspace.project.status)}>{label(workspace.project.status)}</StatusBadge>
          {workspace.project.templateVersionId && templateHref ? (
            <Link href={templateHref} className="rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]"
              aria-label={"View template " + (workspace.templateTitle ?? "attached to workspace")}>
              <StatusBadge tone="neutral">
                Template · {workspace.templateTitle ?? "Attached"}
                {workspace.templateVersion ? " v" + workspace.templateVersion : ""}
              </StatusBadge>
            </Link>
          ) : <StatusBadge tone="neutral">No template attached</StatusBadge>}
          {workspace.project.phase ? <StatusBadge tone="neutral">Phase: {label(workspace.project.phase)}</StatusBadge> : null}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-body">
          {workspace.project.summary || "No workspace summary has been added yet."}
        </p>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
            <span>Overall progress</span><span className="tabular-nums">{progress}%</span>
          </div>
          <MetricBar label="Overall progress" value={progress} maximum={100} size="medium" role="progressbar" />
        </div>
      </div>
      <dl aria-label="Workspace quick facts" className="grid min-w-0 grid-cols-2 gap-0 border-t border-[var(--lms-canvas-border)] lg:border-t-0">
        {facts.map(fact => <div key={fact.label} className="min-w-0 border-b border-[var(--lms-canvas-border)] px-3 py-3">
          <dt className="text-xs text-muted-foreground">{fact.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-foreground">{fact.value}</dd>
        </div>)}
      </dl>
    </div>
  </section>;
}

/** Readiness must use the server's execution verdict plus the recorded administrator override. */
function WorkspaceReadinessSnapshot({ workspace }: { workspace: Workspace }) {
  const readiness = workspace.readiness;
  if (!readiness) return <section role="alert" className="border-y border-warning-border bg-warning-subtle p-4">
    <h2 className="font-semibold">Readiness snapshot is unavailable</h2>
    <p className="mt-1 text-sm">The workspace loaded, but its readiness calculation was not included. Retry before making a submission-readiness decision.</p>
    <Link href={"?retry=1"} className="mt-2 inline-flex text-sm font-semibold text-link underline">Retry</Link>
  </section>;
  const hasFinalSubmission=Boolean(readiness.finalSubmission.latest &&
    readiness.finalSubmission.latest.status!=="DRAFT");
  const ready = workspace.project.status !== "ARCHIVED" &&
    effectiveProjectSubmissionReady(readiness.execution.complete,
      readiness.readinessOverride.state,hasFinalSubmission);
  const tasks = readiness.execution.tasks;
  const sprints = readiness.execution.sprints;
  const doneTasks = workspace.tasks.filter(task => task.status === "DONE"&&!task.deletedAt);
  const withSubmission = doneTasks.filter(task => workspace.taskSubmissions.some(submission =>
    submission.taskId === task.id && Boolean(submission.submissionUrl))).length;
  const totalPlanItems = tasks.total + sprints.total;
  const progress = totalPlanItems > 0
    ? Math.round(100 * (tasks.done + sprints.completed) / totalPlanItems)
    : Math.max(0, Math.min(100, workspace.project.progressPercent ?? 0));
  const override = readiness.readinessOverride;
  const overrideActive = override.state === "FORCE_UNLOCK" || override.state === "FORCE_BLOCK";
  const metrics = [
    { label: "Tasks complete", value: tasks.done + " / " + tasks.total },
    { label: "Sprints complete", value: sprints.completed + " / " + sprints.total },
    { label: "Proof coverage", value: doneTasks.length ? withSubmission + " / " + doneTasks.length + " completed tasks" : "No completed tasks yet" },
    { label: "Submission", value: readiness.finalSubmission.latest ? label(readiness.finalSubmission.latest.status) : "Not submitted" },
  ];
  return <section aria-label="Submission readiness" className="space-y-4 border-b border-[var(--lms-canvas-border)] pb-5">
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Submission readiness</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {hasFinalSubmission?"This workspace already has a final submission":
              ready ? "This workspace is ready to submit" : "This workspace still has readiness gaps"}
          </h2>
        </div>
        <StatusBadge tone={ready ? "success" : "error"}>
          {hasFinalSubmission?"Submitted":ready ? "Ready" : "Not ready"}
        </StatusBadge>
      </div>
      <div>
        <div className="mb-2 flex justify-between gap-2 text-sm font-semibold">
          <span>Overall project progress</span><span className="tabular-nums">{progress}%</span>
        </div>
        <MetricBar label="Overall project progress" role="progressbar" size="medium" value={progress} maximum={100} />
      </div>
      <dl className="grid min-w-0 grid-cols-2 gap-0 border-t border-[var(--lms-canvas-border)] lg:grid-cols-4">
        {metrics.map(metric => <div key={metric.label} className="min-w-0 border-b border-[var(--lms-canvas-border)] px-3 py-3">
          <dt className="text-xs text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold tabular-nums">{metric.value}</dd>
        </div>)}
      </dl>
    </div>
    {overrideActive ? <div role="status" className={
      "border-y px-4 py-3 text-sm " + (override.state === "FORCE_UNLOCK"
        ? "border-success-border bg-success-subtle" : "border-warning-border bg-warning-subtle")
    }>
      <p className="flex items-center gap-2 font-semibold">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
          <rect x="5" y="10" width="14" height="11" rx="2"/>
          {override.state==="FORCE_BLOCK"?
            <path d="M8 10V7a4 4 0 0 1 8 0v3"/>:
            <path d="M8 10V7a4 4 0 0 1 8 0"/>}
        </svg>
        Readiness override active · {override.state === "FORCE_UNLOCK" ? "Force unlocked" : "Force blocked"}
      </p>
      <dl className="mt-2 grid gap-3 sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Reason</dt><dd className="mt-1 whitespace-pre-wrap">{override.note || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Set by</dt><dd className="mt-1">{override.overriddenBy || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Set at</dt><dd className="mt-1">{formatDateTime(override.occurredAt)}</dd></div>
      </dl>
    </div> : <p className="border-y border-border px-4 py-3 text-sm text-body">
      No manual readiness override is active. The status above is based on workspace progress and submission rules.
    </p>}
  </section>;
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


/** Legacy delivery overview is the primary read surface; version history follows. */
function AdminDeliveryOverview({workspace}:{workspace:Workspace}){
 const delivery=workspace.resolvedDelivery;
 if(!delivery)return <div className="border border-[var(--lms-canvas-border)] rounded-[var(--lms-control-radius)] p-4">
  <EmptyState title="Delivery" description="No final delivery has been submitted yet."/>
  <p className="mt-2 text-sm text-muted-foreground">Task-level submissions can still be reviewed from the Tasks tab.</p>
 </div>;
 const latest=workspace.finalDelivery.submissions.find(item=>item.id===delivery.id);
 const mainType=latest?.attachments.some(item=>Boolean(item&&typeof item==="object"&&
  (item as {kind?:unknown}).kind==="FILE"))?"File upload":
  delivery.sourceUrl&&delivery.demoUrl?"Source + demo":delivery.sourceUrl?"Link":"Text";
 const source=safeHttpHref(delivery.sourceUrl);
 const reviewState=String(delivery.reviewStatus??"PENDING");
 const reviewTone=["APPROVED","ACCEPTED"].includes(reviewState)?"success" as const:
  ["CHANGES_REQUESTED","REJECTED"].includes(reviewState)?"warning" as const:
  ["SUBMITTED","UNDER_REVIEW"].includes(reviewState)?"info" as const:"neutral" as const;
 const reviewText=reviewState==="APPROVED"||reviewState==="ACCEPTED"?"Accepted":
  reviewState==="CHANGES_REQUESTED"||reviewState==="REJECTED"?"Changes requested":
  reviewState==="SUBMITTED"||reviewState==="UNDER_REVIEW"?"Under review":
  reviewState==="LOCKED"?"Locked":reviewState==="DRAFT"?"Draft":"Pending";
 return <div role="region" className="space-y-4" aria-label="Latest final delivery">
  <section className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final delivery</p>
     <h3 className="mt-1 text-base font-semibold text-foreground">Submission package and review state</h3></div>
    <StatusBadge tone={reviewTone}>{reviewText}</StatusBadge>
   </div>
   <dl className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2 lg:grid-cols-4">
    <div><dt className="text-xs text-muted-foreground">Submission type</dt><dd>{mainType}</dd></div>
    <div><dt className="text-xs text-muted-foreground">Submitted by</dt><dd>{delivery.submittedBy??"—"}</dd></div>
    <div><dt className="text-xs text-muted-foreground">Submitted at</dt><dd>{formatDateTime(delivery.submittedAt)}</dd></div>
    <div><dt className="text-xs text-muted-foreground">Revisions</dt><dd>{delivery.revisionCount??"—"}</dd></div>
   </dl>
   <div className="mt-4 border-t border-[var(--lms-canvas-border)] pt-3">
    <h4 className="text-sm font-semibold">Primary submission</h4>
    <div className="mt-2 flex flex-wrap gap-3 text-sm">
     {latest?.attachments.map((item,index)=>{
      if(!item||typeof item!=="object")return null;
      const row=item as Record<string,unknown>;
      if(row["kind"]!=="FILE"||typeof row["fileId"]!=="string")return null;
      return <ProjectDeliveryEvidenceDownload key={index} projectId={workspace.project.id}
       fileId={row["fileId"]} name={typeof row["name"]==="string"?row["name"]:"Open submitted file"}/>;
     })}
     {source?<a href={source} target="_blank" rel="noopener noreferrer"
      className="font-semibold text-link underline">Open source link</a>:null}
     {safeHttpHref(delivery.demoUrl)?<a href={safeHttpHref(delivery.demoUrl) ?? undefined}
      target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline">
      Open demo</a>:null}
     {!source&&!latest?.attachments.some(item=>Boolean(item&&typeof item==="object"&&
      (item as {kind?:unknown}).kind==="FILE"))?
       <p className="text-sm text-muted-foreground">No valid file or source link is attached.</p>:null}
    </div>
   </div>
  </section>
  <section className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4">
   <div className="flex flex-wrap justify-between gap-2">
    <h3 className="text-sm font-semibold">Additional evidence</h3>
    <span className="text-xs text-muted-foreground">{delivery.attachments.length} additional item{delivery.attachments.length===1?"":"s"}</span>
   </div>
   {!delivery.attachments.length?<p className="mt-2 text-sm text-muted-foreground">No additional files or links.</p>:
    <ul className="mt-3 space-y-3">{delivery.attachments.map((item,index)=>{
     if(!item||typeof item!=="object")return null;
     const row=item as Record<string,unknown>;
     const name=typeof row["label"]==="string"?row["label"]:
      typeof row["fileName"]==="string"?row["fileName"]:
      typeof row["name"]==="string"?row["name"]:`Attachment ${index+1}`;
     const href=typeof row["url"]==="string"?safeHttpHref(row["url"]):null;
     return <li key={index} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--lms-canvas-border)] pt-3 text-sm">
      <span>{name}</span>
      {row["kind"]==="FILE"&&typeof row["fileId"]==="string"?
       <ProjectDeliveryEvidenceDownload projectId={workspace.project.id} fileId={row["fileId"]} name={name}/>:
       href?<a href={href} target="_blank" rel="noopener noreferrer" className="text-link underline">Open</a>:
       <span className="text-muted-foreground">Unavailable link</span>}
     </li>;
    })}</ul>}
  </section>
  <section className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4">
   <h3 className="text-sm font-semibold">Review</h3>
   <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
    <div><dt className="text-xs text-muted-foreground">Reviewed by</dt><dd>{delivery.reviewedBy??"—"}</dd></div>
    <div><dt className="text-xs text-muted-foreground">Reviewed at</dt><dd>{formatDateTime(delivery.reviewedAt)}</dd></div>
   </dl>
   {delivery.feedback?<div className="mt-3">
    <h4 className="text-xs text-muted-foreground">Mentor feedback</h4>
    <p className="mt-1 whitespace-pre-wrap text-sm text-body">{delivery.feedback}</p>
   </div>:<p className="mt-3 text-sm text-muted-foreground">No mentor feedback has been recorded yet.</p>}
  </section>
 </div>;
}

/** The same project title, mentor subtitle and status badge above every mentor detail tab. */
export function ProjectWorkspaceHeader({workspace,mode,backHref,backLabel,section}: {
  workspace: Workspace;
  mode: "LEARNER" | "MENTOR" | "ADMIN";
  backHref?: string;
  backLabel?: string;
  section?:ProjectWorkspaceSection;
}) {
  const headerDescription = mode==="MENTOR"
              ? [workspace.project.courseLabel?.trim()||null,
                 workspace.members.find(member=>member.role==="MENTOR"&&member.isPrimary)?.displayName??
                 workspace.members.find(member=>member.role==="MENTOR")?.displayName??null]
                .filter(Boolean).join(" · ")||"Project workspace"
              : mode==="ADMIN"&&section==="audit"?
                "Trace resource changes here, or open the full project audit trail for broader events.":
                mode==="ADMIN"&&section==="meetings"?
                "Plan project touchpoints and connect conversations to the work they support.":
                mode==="ADMIN"&&section==="overview"?
                "Shape the project brief mentors and students use to understand the work.":
                mode==="ADMIN"&&section==="sprints"?
                "Plan sprint outcomes, release alignment and delivery cadence for this workspace.":
                mode==="ADMIN"&&section==="tasks"?
                "Shape the work breakdown and review learner submission activity for this workspace.":
                mode==="ADMIN"&&section==="resources"?
                "Curate the references, files and access guidance this workspace team needs.":
                mode==="ADMIN"&&section==="readiness"?
                "Understand submission readiness, proof coverage and any manual override at a glance.":
                mode==="ADMIN"&&section==="summary"?
                  "Health, setup and operating details for this workspace.":
                  workspace.project.summary??undefined;
  return (
    <PageHeader
            title={workspace.project.title?.trim()||"Workspace"}
            {...(headerDescription !== undefined ? {description:headerDescription} : {})}
            actions={
              <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
                {mode==="ADMIN"&&backHref?<PageBackLink href={backHref} label={backLabel??"Back to projects"}/>:null}
                <StatusBadge
                  tone={tone(workspace.project.status)}
                >
                  {label(workspace.project.status)}
                </StatusBadge>
                {mode === "ADMIN" ? (
                  <ProjectChangeTemplateControl
                    projectId={workspace.project.id}
                    status={workspace.project.status}
                    expectedUpdatedAt={workspace.project.updatedAt.toISOString()}
                    hasTemplate={Boolean(workspace.project.templateVersionId)}
                  />
                ) : null}
                {mode === "ADMIN" ? (
                  <ProjectArchiveControl
                    projectId={workspace.project.id}
                    projectTitle={workspace.project.title}
                    status={workspace.project.status}
                    expectedUpdatedAt={workspace.project.updatedAt.toISOString()}
                    deleted={Boolean(workspace.project.deletedAt)}
                  />
                ) : null}
              </div>
            }
          />
  );
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
  hidePageHeader = false,
  polishAdminSection = false,
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
  hidePageHeader?: boolean;
  polishAdminSection?: boolean;
}) {
  const { readiness } = workspace;
  // A missing readiness snapshot must never take down the other workspace tabs.
  // Keep a useful retry state in preference to dereferencing absent server data.
  if (!readiness) {
    return <WorkspaceReadinessSnapshot workspace={workspace} />;
  }
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
  // Same seven-day category threshold as the legacy at-risk workspace detail;
  // preserve the category when a bookmarked link contains an older day count.
  const lastActivity = workspace.activity.length
    ? workspace.activity.reduce((latest,event)=>
      event.occurredAt>latest?event.occurredAt:latest,
      workspace.activity[0]!.occurredAt)
    : workspace.project.updatedAt;
  const inactiveDays = Math.floor(Math.max(0,renderTime.getTime()-lastActivity.getTime())/86400000);
  const stalled = !["ARCHIVED","COMPLETED"].includes(workspace.project.status) &&
    inactiveDays>=7;
  const activeBlocker=Boolean(workspace.project.blocker?.trim()) ||
    workspace.tasks.some(task=>task.status==="BLOCKED");
  const awaitingReview=["SUBMITTED","UNDER_REVIEW"].includes(
    readiness.finalSubmission.latest?.status??"");
  const riskSignals = [
    ...(stalled?["No activity in "+inactiveDays+" day"+(inactiveDays===1?"":"s")]:[]),
    ...(activeBlocker?["Blocked: "+(workspace.project.blocker?.trim()||"Blocked task")]:[]),
    ...(awaitingReview?["Pending review"]:[]),
  ];
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

  // Keep unassigned work visible to administrators. It is a real product-backlog
  // state in vNext, not an empty or missing sprint.
  const backlogTasks = workspace.tasks.filter(task => task.sprintId === null);
  const backlogColumns: DataTableColumn<Workspace["tasks"][number]>[] = [
    { key: "key", header: "Key", mobilePriority: "secondary", cell: task => task.legacyTaskKey || task.templateKey },
    { key: "priority", header: "Priority", mobilePriority: "secondary",
      cell: task => <StatusBadge tone="neutral">{label(task.priority)}</StatusBadge> },
    { key: "title", header: "Title", mobilePriority: "primary", cell: task => task.title },
    { key: "sprint", header: "Sprint", mobilePriority: "secondary", cell: () => "Backlog" },
    { key: "estimate", header: "Estimate", mobilePriority: "secondary",
      cell: task => mentorEstimateLabel(task.estimatePoints, workspace.project.estimationUnit) },
    { key: "type", header: "Type", mobilePriority: "secondary",
      cell: task => task.taskType ? label(task.taskType) : "Not specified" },
    { key: "dueLabel", header: "Due label", mobilePriority: "secondary", cell: task => task.dueLabel || "—" },
    { key: "description", header: "Description", mobilePriority: "secondary",
      cell: task => <span className="block max-w-64 whitespace-pre-wrap break-words">{task.description || "—"}</span> },
    { key: "doneWhen", header: "Done when", mobilePriority: "secondary",
      cell: task => <span className="block max-w-64 whitespace-pre-wrap break-words">{task.acceptanceCriteria || "—"}</span> },
    { key: "approach", header: "Approach", mobilePriority: "secondary",
      cell: task => <span className="block max-w-64 whitespace-pre-wrap break-words">{task.approach || "—"}</span> },
  ];

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
    <div className={mode==="MENTOR" ? "prototype-mentor-project-body min-w-0 space-y-4" : polishAdminSection && mode==="ADMIN" ? "min-w-0 space-y-4" : "min-w-0 space-y-4 md:space-y-6"}>
      {mode!=="ADMIN" && !(mode==="MENTOR" && hidePageHeader)?<PageBackLink href={backHref} label={backLabel === "Projects" ? "Back to projects" : backLabel} />:null}
      {polishAdminSection && mode==="ADMIN"?<PageBackLink href={backHref} label={backLabel} />:null}

      {!hidePageHeader ? <ProjectWorkspaceHeader workspace={workspace} mode={mode} section={activeSection}
          {...(mode==="ADMIN"&&!polishAdminSection&&backHref!==undefined?{backHref}:{})}
          {...(backLabel!==undefined?{backLabel}:{})} /> : null}
      {mode === "ADMIN" ? (
        <Breadcrumbs items={[
          { label: "Projects", ...(sectionBaseHref ? { href: sectionBaseHref.replace(/\/[^/]+$/, "") } : backHref ? { href: backHref } : {}) },
          ...(sectionBaseHref ? [{label:"Workspaces",...(backHref ? {href:backHref} : {})}] : []),
          { label: workspace.project.title?.trim()||"Workspace",
            ...(sectionBaseHref ? { href: sectionBaseHref+"/summary"+sectionQuerySuffix } : {}) },
          ...(activeSection ? [{label: PROJECT_WORKSPACE_SECTION_LABELS[activeSection]}] : []),
        ]} />
      ) : null}
      {sectionBaseHref ? (
        <Tabs className="min-w-0" ariaLabel="Project workspace sections" renderPanel={false} value={activeSection ?? "summary"}
          items={PROJECT_WORKSPACE_SECTIONS.map(section=>({
            value:section, label:PROJECT_WORKSPACE_SECTION_LABELS[section],
            href:sectionBaseHref+"/"+section+sectionQuerySuffix,
          }))} />
      ) : null}

      {mode === "ADMIN" && show("summary") && riskSignals.length>0 ?
        <section role="status" aria-label="Current workspace risk"
          className={"border-y px-4 py-3 text-sm "+
            (riskSignals.length>=3?"border-error-border bg-error-subtle":
              "border-warning-border bg-warning-subtle")}>
          <p className="font-semibold text-foreground">
            Flagged as at-risk ({riskSignals.length} signal{riskSignals.length===1?"":"s"})
          </p>
          <p className="mt-1 text-body">{riskSignals.join(" · ")}</p>
        </section> : null}

      {mode === "ADMIN" && riskReason ? (() => {
        const reasons = riskReason.split(",").map(reason=>reason.trim()).filter(Boolean);
        const hadBlocker = reasons.some(reason=>/^(BLOCKER|Active blocker)$/i.test(reason));
        const hadReview = reasons.some(reason=>/^(REVIEW|Pending review)$/i.test(reason));
        const blockerActive = Boolean(workspace.project.blocker?.trim()) ||
          workspace.tasks.some(task=>task.status==="BLOCKED");
        const reviewActive = workspace.taskSubmissions.some(item=>item.status==="SUBMITTED");
        const hadStaleness=reasons.some(reason=>
          /^(STALLED|No activity in \d+ days?|No recent activity)$/i.test(reason));
        const mismatch = (hadBlocker&&!blockerActive)||(hadReview&&!reviewActive)||
          (hadStaleness&&!stalled);
        return <section role="status"
          className="border-y border-info-border bg-info-subtle px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" className="size-4 shrink-0">
              <circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>
            </svg>
            Opened via a filtered view
          </p>
          <p className="mt-1 text-body">
            {mismatch ? "Flagged there for: " : "Reason: "}{riskReason}
          </p>
          {mismatch ? <p className="mt-1 text-body">
            This page&apos;s own recomputation no longer shows the same reason.
            Activity data may have updated since. Refresh the risk report.
          </p> : null}
        </section>;
      })() : null}

      {mode === "ADMIN" && show("readiness") ? (
        <Link href={(backHref.startsWith("/college/") ? "/college/projects/readiness" : "/admin/projects/readiness") + "?projectId=" + encodeURIComponent(workspace.project.id)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
          Manage override
        </Link>
      ) : null}

      {readOnly ? (
        <section
          role="status"
          className="border-y border-border bg-[var(--lms-neutral-50)] px-4 py-3"
        >
          <p className="m-0 text-sm font-semibold text-foreground">
            {archived?"Archived workspace":
              workspace.project.status==="COMPLETED"?"Completed project · read only":
              "Read-only project access"}
          </p>
          <p className="mt-1 text-sm leading-6 text-body">
            {archived&&mode==="MENTOR"?
              "This workspace is archived. You can review historical tasks, resources, meetings and submissions, but cannot change them.":
              archived&&mode==="LEARNER"?
                "This workspace is archived, so it is read-only.":
              workspace.project.status==="COMPLETED"?
                "This project is complete. Existing work and meetings remain available to read; editing is disabled.":
                mode==="MENTOR"?
                  "Your Project Mentor membership is read-only. Ask the College Admin to restore editing access or assign a writable Mentor role.":
                  "Team, execution, delivery, resources, meetings and activity remain available for review. Mutations are disabled."}
          </p>
        </section>
      ) : null}

      {mode === "ADMIN" && show("summary") ? (
        <WorkspaceHealthSnapshot workspace={workspace}
          templateHref={(backHref.startsWith("/college/") ? "/college/projects/templates/" : "/admin/projects/templates/") +
            encodeURIComponent(workspace.project.templateId ?? "") +
            (backHref.startsWith("/college/") ? "" : "/overview")} />
      ) : null}
      {show("readiness") ? <WorkspaceReadinessSnapshot workspace={workspace} /> : null}
      {mode==="ADMIN"&&show("summary")&&!readOnly?<CollegeProjectSummaryEditorFull
        project={workspace.project}
        taskProgress={{
          done: readiness.execution.tasks.done + readiness.execution.sprints.completed,
          total: readiness.execution.tasks.total + readiness.execution.sprints.total,
        }}
        estimatedTaskCount={workspace.tasks.filter(task =>
          !task.deletedAt && task.estimatePoints !== null).length}
        hasMentor={workspace.members.some(member=>
          member.role==="MENTOR")}/>:null}
      {(mode !== "ADMIN" && show("summary")) || (mode === "MENTOR" && show("overview")) ? (
        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-0 border-t border-[var(--lms-canvas-border)] xl:grid-cols-4">
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
        <section className="border-b border-[var(--lms-canvas-border)] pb-5">
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
          <ProjectDeliveryHistoryTimeline projectId={workspace.project.id}/>
        </section>
      ) : null}

      {show("overview") ? (
        <section className="border-b border-[var(--lms-canvas-border)] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold text-foreground">{mode==="ADMIN"?"Overview":"About this project"}</h2>
            {mentorReviewHref ? <Link href={mentorReviewHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary px-3 text-sm font-semibold text-link hover:bg-primary-subtle sm:w-auto md:min-h-9">
              Review submission
            </Link> : null}
          </div>
          {(mode==="ADMIN"||mode==="MENTOR")&&!readOnly?<WorkspaceBriefEditor
            requireDeliverables={workspaceBriefRequiresDeliverables(workspace.project.status)}
            projectId={workspace.project.id} initial={authoredBrief}
            updatedAt={workspace.project.updatedAt}/>:null}
          {mode==="MENTOR"&&!readOnly?<MentorProjectAboutEditor project={workspace.project}/>:null}
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
            <section className="border-b border-border pb-3">
              <h3 className="font-semibold text-foreground">Definition of done</h3>
              <p className="mt-1 text-sm text-body">
                Finish the planned tasks, have each sprint signed off, and send the final submission for mentor review.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Submission also needs all {workspace.sprints.length} sprint(s) signed off.
              </p>
            </section>
            <section className="border-b border-border pb-3">
              <h3 className="font-semibold text-foreground">Who’s who</h3>
              <ul className="mt-2 space-y-1 text-sm text-body">
                <li>Mentor · Reviews tasks and final delivery</li>
                <li>Project team · Works on assigned tasks and shared submissions</li>
                {workspace.members.filter(m=>m.role==="MENTOR").slice(0,2).map(m=>
                  <li key={m.membershipId}>{m.displayName} · Mentor</li>)}
              </ul>
            </section>
          </div>:null}
          {mode==="MENTOR"?<section aria-label="Final submission" className="mt-4 border-b border-border pb-4 text-sm text-body">
            <h3 className="font-semibold text-foreground">Final submission</h3>
            <p className="mt-1">Status: {readiness.finalSubmission.latest?label(readiness.finalSubmission.latest.status):"Not submitted"}</p>
            <Link href={mentorReviewHref??("/mentor/projects/"+workspace.project.id+"?tab=delivery")}
              className="mt-2 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline">Review submission</Link>
          </section>:null}
          {mode==="MENTOR"?<section aria-label="Mentor task progress" className="mt-4 border-b border-border pb-4">
            <h3 className="font-semibold">Task progress</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {groupLearnerBoardLanes(workspace.tasks,workspace.sprints).map(lane=>
                <div key={lane.id} className="rounded-[var(--lms-control-radius)] bg-muted p-2 text-center">
                  <p className="text-xl font-bold tabular-nums">{lane.tasks.length}</p>
                  <p className="text-xs text-body">{lane.label}</p>
                </div>)}
            </div>
            <p className="mt-2 text-xs text-body">Submission also needs all {readiness.execution.sprints.total}
              {" "}sprints signed off ({readiness.execution.sprints.completed} so far).</p>
          </section>:null}
          {mode==="LEARNER"?<section aria-label="Task completion donut" className="mt-4 border-b border-border pb-4">
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
          {mode==="LEARNER"?<section aria-label="Task lane progress" className="mt-4 border-b border-border pb-4">
            <h3 className="font-semibold text-foreground">Task progress</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {groupLearnerBoardLanes(workspace.tasks,workspace.sprints).map(lane=>
                <div key={lane.id} className="rounded-[var(--lms-control-radius)] bg-muted p-2 text-center">
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
          ) : mode==="ADMIN"&&!readOnly
            ? <p className="mt-2 text-sm text-body">Start by describing the project goal, deliverables and completion conditions in the editor above.</p>
            : <p className="mt-2 text-sm text-body">No authored project brief is available.</p>}
          {mode === "LEARNER" ? (
            <div className="mt-3 space-y-2 text-sm text-body">
              {workspace.project.phase ? <p>Phase: <strong>{workspace.project.phase}</strong></p> : null}
              {workspace.project.dueLabel || workspace.project.endDate ?
                <p>Due date: <strong>{workspace.project.endDate?
                  (projectTaskDueState(workspace.project.endDate,workspace.project.status==="COMPLETED"?"DONE":"TODO",renderTime)
                    ??"Due")+" · ":""}{workspace.project.dueLabel ||
                  workspace.project.endDate}</strong></p> : <p>No due date</p>}
              {!archived && workspace.project.nextAction ?
                <p>Next step: {workspace.project.nextAction}</p> : null}
              {!archived && workspace.project.blocker ?
                <div className="rounded-[var(--lms-control-radius)] border border-warning-border bg-warning-subtle p-3">
                  <p className="font-semibold">Requires attention</p>
                  <p className="mt-1 whitespace-pre-wrap">{workspace.project.blocker}</p>
                  <Link href={"/learn/projects/"+workspace.project.id+"?tab=board&taskStatus=BLOCKED"}
                    className="inline-flex min-h-11 md:min-h-9 items-center text-link underline">
                    Open blocked work
                  </Link>
                </div> : null}
            </div>
          ) : null}
          {mode === "LEARNER" ? (
            <section className="mt-4 border-b border-border pb-4">
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
                className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline">
                {!archived && readiness.finalSubmission.latest?.status === "CHANGES_REQUESTED"
                  ? "Update your submission" : "View final submission"}
              </Link>
            </section>
          ) : null}
          {mode === "LEARNER" ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
                  <p className="font-semibold text-foreground">Mentor</p>
                  <p className="mt-1 text-body">{workspace.members.find(member =>
                    member.role === "MENTOR" && member.isPrimary)?.displayName ??
                    workspace.members.find(member => member.role === "MENTOR")?.displayName ??
                    "Not assigned"}</p>
                </div>
                <div className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
                  <p className="font-semibold text-foreground">{archived?"Archived board":"Next step"}</p>
                  <Link href={"/learn/projects/" + workspace.project.id + "?tab=board"}
                    className="mt-1 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link hover:underline">
                    {archived?"View the Board":"Open the Board"} →
                  </Link>
                </div>
              </div>
              {!archived && workspace.tasks.some(task => task.status === "BLOCKED") ? (
                <div className="rounded-[var(--lms-control-radius)] border border-warning-border bg-warning-subtle p-3">
                  <h3 className="text-sm font-semibold">Requires attention</h3>
                  <p className="mt-1 text-sm text-body">One or more tasks are blocked.</p>
                  <Link href={"/learn/projects/" + workspace.project.id + "?tab=board&taskStatus=BLOCKED"}
                    className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline">
                    Open blocked work
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          {mode==="MENTOR"?<section className="mt-4 space-y-3 border-b border-border pb-4 text-sm">
            <p>Mentor: {workspace.members.find(m=>m.role==="MENTOR"&&m.isPrimary)?.displayName??
              workspace.members.find(m=>m.role==="MENTOR")?.displayName??"Not assigned"}</p>
            <p>Due date: <strong>{workspace.project.dueLabel??workspace.project.endDate??"No due date"}</strong></p>
            {workspace.project.phase?<p>Phase: {workspace.project.phase}</p>:null}
            <div className="flex flex-wrap gap-3">
              <Link href={"/mentor/projects/"+workspace.project.id+"?tab=board"}
                className="min-h-11 md:min-h-9 font-semibold text-link underline">
                {archived?"View archived board":workspace.project.nextAction??"Next step · Open the Board"} →
              </Link>
            </div>
            {!archived && (workspace.project.blocker||workspace.tasks.some(t=>t.status==="BLOCKED"))?
              <div role="status" className="rounded-[var(--lms-control-radius)] border border-warning-border bg-warning-subtle p-3">
                <p className="font-semibold">Requires attention</p>
                <p className="mt-1 whitespace-pre-wrap">{workspace.project.blocker||
                  workspace.tasks.filter(t=>t.status==="BLOCKED").length+" blocked tasks"}</p>
                <Link href={"/mentor/projects/"+workspace.project.id+"?tab=board&lane=BLOCKED"}
                  className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline">Open blocked work</Link>
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
            <h2 className="m-0 text-lg font-semibold text-foreground">{mode==="LEARNER"?"Project team":"Team"}</h2>
            <p className="mt-1 text-sm text-body">Manage mentor ownership, student membership and workload across this workspace.</p>
          </div>
          {mode==="ADMIN"&&!readOnly
            ?<CollegeProjectMentorDialog projectId={workspace.project.id}
              collegeId={workspace.project.collegeId}
              {...(() => {
                const mentorName=workspace.members.find(member=>member.role==="MENTOR"&&member.isPrimary)?.displayName;
                return mentorName===undefined?{}:{currentMentorName:mentorName};
              })()}/>
            :mode==="ADMIN"?<Button type="button" variant="secondary" disabled>Reassign mentor…</Button>:null}
          {mode==="ADMIN"&&!readOnly&&!workspace.project.teamGroupId
            ?<CollegeProjectStudentRosterDialog projectId={workspace.project.id}
              expectedUpdatedAt={workspace.project.updatedAt.toISOString()}/>
            :mode==="ADMIN"?<Button type="button" variant="secondary" disabled>Manage students…</Button>:null}
        </div>
        {mode==="ADMIN"?<CollegeAdminWorkspaceTeamOverview members={workspace.members} tasks={workspace.tasks}/>:null}
        {mode==="MENTOR" && mentorWorkspaceMissingPrimaryMentor(workspace.project.status,workspace.members) ? (
          <p role="status" className="rounded-[var(--lms-control-radius)] border border-warning-border bg-warning-subtle p-3 text-sm text-body">
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
          <div role="status" className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-y border-info-border bg-info-subtle px-3 py-3 text-sm text-body">
            <div className="min-w-0">
              <strong className="block font-semibold text-foreground">This workspace is a team</strong>
              Its learners are kept by the team it was created with. Only College Admin or
              Super Admin may change team membership in the class team workspace;
              mentors can review Project work but cannot edit team membership. College Admin changes are audited and notify affected accounts; mentors must request roster corrections through the College Admin workspace.
            </div>
            {mode === "ADMIN" && !readOnly ?
              <ProjectTeamRosterReconcile projectId={workspace.project.id} /> : null}
          </div>
        ) : null}
        {mode==="ADMIN"&&!readOnly&&!workspace.project.teamGroupId?<div className="flex justify-end">
          <AddProjectMemberControl projectId={workspace.project.id}/>
        </div>:null}
        {mode==="ADMIN"?<><h3 className="text-base font-semibold text-[var(--lms-heading)]">Project people</h3><ProjectRosterTable projectId={workspace.project.id} rows={workspace.members.map(member=>{
          // Deleted tasks are not part of a member's current assignment coverage.
          // Match membership UUIDs; legacy numeric assignee IDs are not valid here.
          const assigned=workspace.tasks.filter(task=>!task.deletedAt&&
            task.assigneeMembershipId===member.membershipId);
          const last=assigned.reduce<Date|null>((mostRecent,task)=>
            !mostRecent || task.updatedAt>mostRecent ? task.updatedAt : mostRecent,null);
          return {
            id:member.id,membershipId:member.membershipId,displayName:member.displayName,
            role:member.role,roleLabel:member.roleLabel,isPrimary:member.isPrimary,
            tasksAssigned:assigned.length,tasksDone:assigned.filter(task=>task.status==="DONE").length,
            tasksInReview:assigned.filter(task=>task.status==="IN_REVIEW").length,
            tasksInProgress:assigned.filter(task=>task.status==="IN_PROGRESS").length,
            lastTaskUpdate:last?formatDateTime(last):null,
            canEdit:!readOnly&&(!workspace.project.teamGroupId||member.role!=="LEARNER"),
          };
        })}/></>:null}
        <div className="grid min-w-0 gap-x-6 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
          {mode==="MENTOR"?workspace.mentorRoster.map(member=>{
            const active=member.endedAt===null && member.memberStatus==="ACTIVE" &&
              member.accountStatus==="ACTIVE";
            const linkedIn=member.role==="MENTOR"?safeProjectExternalHref(member.linkedIn):null;
            return <article key={member.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
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
                  className="inline-flex min-h-11 md:min-h-9 items-center text-link underline">LinkedIn profile ↗</a>:null}
              </div>:null}
            </article>;
          }):null}
          {mode==="LEARNER"?workspace.members.map((member) => (
            <article
              key={member.id}
              className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4"
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
            </article>
          )):null}
        </div>
      </section> : null}

      {show("sprints") || show("tasks") ? <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            {mode==="ADMIN"?(activeSection==="tasks"?"Task plan":activeSection==="sprints"?
              "Sprint plan":"Execution"):"Releases and Sprints"}
          </h2>
          {mentorReviewHref && !show("overview") ? <Link href={mentorReviewHref}
            className="mt-2 inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary px-3 text-sm font-semibold text-link">
            Review submission
          </Link> : null}
          {mode==="ADMIN"?<p className="mt-1 text-sm text-body">
            {activeSection==="tasks"?
              "Keep each task small enough to own, link it to the right sprint, and make “done” explicit. Workflow state and learner submissions stay read-only here.":
              "Delivery cadence · Plan work in clear, release-bound increments."}
          </p>:null}
          {mode==="ADMIN"&&show("sprints")?<section aria-label="Sprint plan summary"
            className="mt-4 space-y-3 border-y border-[var(--lms-canvas-border)] py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Delivery cadence</p>
            <h3 className="text-base font-semibold text-foreground">Plan work in clear, release-bound increments</h3>
            <p className="text-sm leading-6 text-body">
              Keep sprint goals outcome-focused and attach every sprint to the release it contributes to.
              The row summaries let you scan dates and task completion without expanding everything.
            </p>
            <dl className="grid grid-cols-2 gap-x-4 border-t border-[var(--lms-canvas-border)] sm:grid-cols-4">
              {([
                ["Total sprints",workspace.sprints.length],
                ["Active",workspace.sprints.filter(sprint=>sprint.status==="ACTIVE").length],
                ["Completed",workspace.sprints.filter(sprint=>sprint.status==="COMPLETED").length],
                ["Releases available",workspace.releases.length],
              ] as const).map(([name,count])=><div key={name}
                className="min-w-0 border-b border-[var(--lms-canvas-border)] px-2 py-3">
                <dt className="text-xs text-body">{name}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{count}</dd>
              </div>)}
            </dl>
          </section>:null}
          {mode!=="LEARNER"&&!readOnly?
            <div id="mentor-project-add-release" className="scroll-mt-24">
              <MentorReleaseEditor projectId={workspace.project.id}/>
            </div>:null}
          {mode==="MENTOR"&&workspace.releases.length===0?
            <EmptyState title="No sprints yet"
              description="Add the sprints this project should be measured against."
              action={readOnly?
                <p className="text-sm text-body">This workspace is read-only, so sprints cannot be added.</p>:
                <p className="text-sm text-body">First <a href="#mentor-project-add-release"
                  className="font-semibold text-link underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">add a release</a>,
                  then use Add sprint inside that release. The Board and Task Allocation will appear here.</p>}
            />:null}
          {workspace.releasesLoadError ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-error bg-error-subtle px-3 py-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">Project releases could not be loaded</p>
                <p className="mt-1 text-body">Tasks, Team and other loaded workspace sections remain available.</p>
              </div>
              <Link href={"?retry=1"} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
                Retry
              </Link>
            </div>
          ) : null}
          {mode!=="MENTOR"&&!workspace.releasesLoadError&&workspace.releases.length===0?
            <EmptyState title={mode==="ADMIN"?"No releases on this project yet":"No sprints yet"}
              description={mode==="ADMIN"?
                "A sprint must belong to a release. Create or seed a project release before adding a new sprint.":
                "Add the sprints this project should be measured against."}/>:null}
          {mode==="ADMIN"&&!workspace.releasesLoadError&&workspace.releases.length>0&&
            workspace.sprints.length===0?<p role="status" className="border-y border-border py-3 text-sm text-body">
              No sprints yet. Add the first sprint when a release is ready.
            </p>:null}
          {mode==="ADMIN"&&show("tasks")&&!workspace.releasesLoadError&&workspace.sprints.length===0?
            <div role="status" className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-y border-info-border bg-info-subtle px-3 py-3 text-sm">
              <span>No sprints are available yet. You can still draft tasks, but add sprints before assigning tasks to a delivery cycle.</span>
              <Link href={(sectionBaseHref??backHref)+"/sprints"} className="font-semibold text-link underline">
                Sprints
              </Link>
            </div>:null}
        </div>
        {mode==="LEARNER"?<div role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
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
              className={"min-h-11 rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm font-semibold "+
                (release.status==="SHIPPED"?"border-success-border bg-success-subtle text-success-text":
                  release.status==="ACTIVE"?"border-primary bg-primary-subtle text-link":
                  "border-border bg-surface text-body")}>
              {release.title} · {label(release.status)}
            </a>)}
          </nav>:null}
        {mode==="ADMIN"&&show("tasks")?(()=>{
          const liveTasks=workspace.tasks.filter(task=>!task.deletedAt);
          const liveTaskIds=new Set(liveTasks.map(task=>task.id));
          const activeSubmissions=workspace.taskSubmissions.filter(item=>
            liveTaskIds.has(item.taskId));
          const latest=new Map<string,(typeof workspace.taskSubmissions)[number]>();
          for(const item of activeSubmissions){
            const prior=latest.get(item.taskId);
            if(!prior||item.version>prior.version)latest.set(item.taskId,item);
          }
          const submitted=[...latest.values()].filter(item=>item.status==="SUBMITTED").length;
          const done=liveTasks.filter(task=>task.status==="DONE").length;
          const active=liveTasks.filter(task=>["IN_PROGRESS","IN_REVIEW"].includes(task.status)).length;
          return <div className="space-y-4">
            <section aria-label="Task plan metrics" className="space-y-2">
             <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Work breakdown</p>
             <h3 className="text-base font-semibold text-foreground">
               Turn sprint goals into clear, reviewable work
             </h3>
             <p className="text-sm text-body">
               Keep each task small enough to own, link it to the right sprint,
               and make “done” explicit. Workflow state and learner submissions stay read-only here.
             </p>
             <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
              {([
               ["Tasks",liveTasks.length],["In progress",active],
               ["Done",done],["Submissions",activeSubmissions.length],
              ] as const).map(([name,count])=><div key={name} className="border-b border-border p-3">
               <dt className="text-xs text-body">{name}</dt>
               <dd className="text-xl font-semibold tabular-nums">{count}</dd>
              </div>)}
             </dl>
            </section>
            {!readOnly ? <>
              <ProjectAdminTaskAdd key={projectTaskPlanToken(workspace.tasks)+"-new"}
                projectId={workspace.project.id}
                tasksToken={projectTaskPlanToken(workspace.tasks)}
                estimationUnit={workspace.project.estimationUnit}
                sprints={workspace.sprints.map(sprint=>({
                  id:sprint.id,title:sprint.title,status:sprint.status,
                  releaseStatus:workspace.releases.find(release=>
                    release.id===sprint.releaseId)?.status??"SHIPPED",
                }))}/>
              <ProjectTaskPlanEditor key={projectTaskPlanToken(workspace.tasks)}
            projectId={workspace.project.id}
            tasksToken={projectTaskPlanToken(workspace.tasks)}
            sprints={workspace.sprints.map(sprint => ({
              id: sprint.id, title: sprint.title, status: sprint.status,
              releaseStatus: workspace.releases.find(release => release.id === sprint.releaseId)?.status ?? "SHIPPED",
            }))}
            tasks={workspace.tasks.filter(task => !task.deletedAt).map(task => ({
              id: task.id,
              key: task.legacyTaskKey || task.templateKey,
              title: task.title,
              priority: task.priority as ProjectTaskPlanRow["priority"],
              sprintId: task.sprintId,
              estimatePoints: task.estimatePoints,
              taskType: task.taskType as ProjectTaskPlanRow["taskType"],
              dueLabel: task.dueLabel,
              description: task.description,
              acceptanceCriteria: task.acceptanceCriteria,
              approach: task.approach,
              status: task.status,
            }))} />
              <p className="text-xs text-body">
                Assignee, status and submission state are not changed here.
              </p>
            </> : null}
            <ProjectTaskSubmissionOverview
              metrics={[
                {label:"Total submissions",value:String(activeSubmissions.length)},
                {label:"Submitted",value:String(submitted)},
                {label:"Approved",value:String(activeSubmissions.filter(item=>item.status==="APPROVED").length)},
                {label:"Changes requested",value:String(activeSubmissions.filter(item=>item.status==="CHANGES_REQUESTED").length)},
              ]}
              rows={activeSubmissions.map(item=>({
                id:item.id,
                taskTitle:workspace.tasks.find(task=>task.id===item.taskId)?.title??"Recorded task",
                submitter:workspace.members.find(member=>
                  member.membershipId===item.submittedByMembershipId)?.displayName??"—",
                version:item.version,status:item.status,
                submittedAt:item.submittedAt.toISOString(),
                reviewedAt:item.reviewedAt?.toISOString()??null,
                submissionUrl:safeHttpHref(item.submissionUrl),
              })).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))}
            />
          </div>;
        })():null}
        {mode === "ADMIN" && backlogTasks.length > 0 ? (
          <section aria-label="Product backlog" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Product backlog</h3>
              <p className="mt-1 text-sm text-body">
                {backlogTasks.length} task{backlogTasks.length === 1 ? "" : "s"} not assigned to a sprint.
                Tasks remain in the backlog until explicitly allocated to an active plan.
              </p>
            </div>
            <DataTable columns={backlogColumns} rows={backlogTasks}
              getRowKey={task => task.id} caption="Unassigned project tasks"
              empty={<EmptyState title="No backlog tasks" description="All tasks are assigned to a sprint." />} />
          </section>
        ) : null}
        <div className="space-y-4">
          {workspace.releases.map((release) => (
            <article
              key={release.id}
              id={"project-release-"+release.id}
              className="min-w-0 scroll-mt-24 border-b border-[var(--lms-canvas-border)] py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-link">
                    Release {release.sequence + 1}
                  </p>
                  <h3 className="mt-1 min-w-0 break-words text-base font-semibold text-foreground">
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
                <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <StatusBadge tone={tone(release.status)}>
                    {label(release.status)}
                  </StatusBadge>
                  {mode!=="LEARNER"&&!readOnly?<MentorReleaseEditor
                    projectId={workspace.project.id} release={release}
                    linkedSprints={(sprintsByRelease.get(release.id)??[]).length}/>:null}
                  {mode !== "LEARNER" && !readOnly && release.status !== "SHIPPED" ? (
                    <MentorSprintCreate projectId={workspace.project.id}
                      inline={mode==="ADMIN"} releaseId={release.id}
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
              {mode === "ADMIN" && !readOnly && release.status !== "SHIPPED" &&
                (sprintsByRelease.get(release.id)??[]).length > 0 ? (
                <div className="mt-3">
                  <ProjectSprintPlanEditor projectId={workspace.project.id}
                    releaseId={release.id}
                    sprints={(sprintsByRelease.get(release.id)??[]).map(sprint=>({
                      id:sprint.id,
                      key:sprint.legacySprintKey??sprint.templateKey,
                      dueLabel:sprint.dueLabel,
                      title:sprint.title,description:sprint.description,
                      goal:sprint.goal,definitionOfDone:sprint.definitionOfDone,
                      startDate:sprint.startDate,endDate:sprint.endDate,dueDate:sprint.dueDate,
                      updatedAt:sprint.updatedAt.toISOString(),status:sprint.status,
                      sequence:sprint.sequence,
                    }))} />
                </div>
              ) : null}

              <ProjectSprintRowList rows={(sprintsByRelease.get(release.id)??[]).map(sprint=>({
                id:sprint.id,title:sprint.title,status:sprint.status,
                description:sprint.description,goal:sprint.goal,dueLabel:sprint.dueLabel,
              }))}>
                {(sprintsByRelease.get(release.id) ??
                  []).map((sprint) => (
                  <section
                    key={sprint.id}
                    className="min-w-0 border-t border-[var(--lms-canvas-border)] py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 min-w-0 break-words text-sm font-semibold text-foreground">
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
                      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
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
                                expectedPlanToken={mentorSprintPlanRevisionToken(
                                  workspace.sprints.filter(row=>row.releaseId===sprint.releaseId)
                                )}
                              estimationUnit={workspace.project.estimationUnit}
                                goal={sprint.goal}
                                definitionOfDone={sprint.definitionOfDone}
                                startDate={sprint.startDate}
                                endDate={sprint.endDate}
                                dueDate={sprint.dueDate}
                                dueLabel={sprint.dueLabel}
                                sprintKey={sprint.legacySprintKey??sprint.templateKey}
                                releaseTitle={release.title}
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
                        <p role="status" className="border-l-2 border-[var(--lms-canvas-border)] pl-3 py-2 text-xs text-body">
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
                            className="min-w-0 scroll-mt-24 border-t border-[var(--lms-canvas-border)] py-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="m-0 min-w-0 break-words text-sm font-semibold text-foreground">
                                  {task.title}
                                </p>
                                {task.description ? (
                                  <p className="mt-1 text-xs leading-5 text-body">
                                    {task.description}
                                  </p>
                                ) : null}
                                {task.approach ? <Disclosure title="Approach"
                                  className="mt-2 border-t border-[var(--lms-canvas-border)] pt-2 text-xs text-body">
                                  <p className="mt-2 whitespace-pre-wrap break-words">{task.approach}</p>
                                </Disclosure>:null}
                                {showMentorTaskCriteria(mode,task.acceptanceCriteria) ? (
                                  <Disclosure title="Acceptance criteria" className="mt-2 border-t border-[var(--lms-canvas-border)] py-2">
                                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-body">
                                      {learnerTaskCriteriaPreview(task.acceptanceCriteria)}
                                    </p>
                                  </Disclosure>
                                ) : null}
                                {mode==="MENTOR" && mentorTaskReviewEvidence(task.status,latestAttempt)==="REVIEW_PENDING" ? (
                                  <p role="status" className="mt-2 text-xs font-semibold text-link">
                                    Submitted attempt v{latestAttempt?.version} is waiting for Mentor review.
                                  </p>
                                ) : null}
                                {mode==="MENTOR" && latestAttempt ? (
                                  <Link href={mentorTaskFeedbackHref(workspace.project.id,task.id)}
                                    className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-xs font-semibold text-link underline">
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
                              <div><dt className="font-semibold">Key</dt>
                                <dd>{task.legacyTaskKey || task.templateKey}</dd></div>
                              <div><dt className="font-semibold">Assignee</dt><dd>{taskFacts.assignee}</dd></div>
                              <div><dt className="font-semibold">Due date</dt>
                                <dd>{taskFacts.dueDate}
                                  {projectTaskDueState(task.dueDate,task.status,renderTime) ?
                                    <span className="ml-2 font-semibold text-warning-text">
                                      {projectTaskDueState(task.dueDate,task.status,renderTime)}
                                    </span> : null}
                                </dd>
                              </div>
                              <div><dt className="font-semibold">Sprint</dt><dd>{sprint.title}</dd></div>
                              <div><dt className="font-semibold">Due label</dt>
                                <dd>{task.dueLabel || "Not set"}</dd></div>
                              <div><dt className="font-semibold">Estimate</dt><dd>{mentorEstimateLabel(task.estimatePoints,workspace.project.estimationUnit)}</dd></div>
                              <div><dt className="font-semibold">Task type</dt><dd>{taskFacts.taskType}</dd></div>
                              {task.acceptanceCriteria ? <div className="sm:col-span-2">
                                <dt className="font-semibold">Done when</dt>
                                <dd className="whitespace-pre-wrap break-words">{task.acceptanceCriteria}</dd>
                              </div> : null}
                              {taskFacts.blockerReason ? <div className="sm:col-span-2">
                                <dt className="font-semibold">Blocker note</dt>
                                <dd className="whitespace-pre-wrap break-words">{taskFacts.blockerReason}</dd>
                              </div> : null}
                              {latestAttempt?.submissionUrl && safeHttpHref(latestAttempt.submissionUrl) ?
                                <div className="sm:col-span-2"><dt className="font-semibold">Submission</dt>
                                  <dd><a target="_blank" rel="noopener noreferrer"
                                    href={safeHttpHref(latestAttempt.submissionUrl)!}
                                    className="text-link underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Open submission</a></dd>
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
                              <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2 border-t border-[var(--lms-canvas-border)] pt-3">
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
              </ProjectSprintRowList>
            </article>
          ))}
        </div>
      </section> : null}

      {show("delivery") ? <section className="space-y-3">
        {mode === "LEARNER" && workspace.members.filter(member => member.role === "LEARNER").length > 1 ? (
          <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm text-body">
            Team submission: this final delivery is shared with everyone on your project team.
            Edits and submission status are visible to all team members.
          </div>
        ) : null}
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            {mode==="ADMIN"?"Delivery":"Final submission"}
          </h2>
          {mode==="ADMIN"?<p className="mt-1 text-sm text-muted-foreground">Review the final submission package, evidence, revisions and mentor feedback.</p>:null}
        </div>
        {mode==="ADMIN"?<AdminDeliveryOverview workspace={workspace}/>:null}
        {mode==="ADMIN"&&workspace.finalDelivery.submissions.length>0?
         <div className="mt-4 space-y-1">
          <h3 className="text-sm font-semibold">Submission history</h3>
          <p className="text-xs text-body">
            {workspace.finalDelivery.submissions.length} recorded version{
              workspace.finalDelivery.submissions.length===1?"":"s"}.
            The latest version is shown first. Expand an earlier version to
            review its original evidence and decisions.
          </p>
         </div>:null}
        {mode==="MENTOR" && workspace.mentorEvidence.latestDelivery ? (
          <p role="status" className="min-w-0 border-y border-[var(--lms-canvas-border)] py-3 text-sm text-body">
            Latest recorded delivery: version {workspace.mentorEvidence.latestDelivery?.version}
            {" · "}{workspace.mentorEvidence.latestDelivery?.status}.
            Historic versions remain available below.
          </p>
        ) : null}
        {workspace.finalDelivery.submissions.length ===
        0 ? (
          <div className="space-y-2">
            <EmptyState title="Not submitted" description="No final delivery has been submitted." />
            {mode === "ADMIN" ? <p className="text-sm text-body">
              Task-level submissions can still be reviewed from the Tasks tab.
            </p> : null}
          </div>
        ) : (
          <div className="space-y-3">
            {[...workspace.finalDelivery.submissions].sort(
              (a,b)=>b.version-a.version).map(
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

                const historical=workspace.finalDelivery.submissions.some(
                  row=>row.version>submission.version);
                const content=(
                  <article
                    key={submission.id}
                    className="min-w-0 scroll-mt-24 border-b border-[var(--lms-canvas-border)] py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-link">
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
                          <dd>{submission.legacyRevisionCount ?? "—"}</dd></div>
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
                          const name = typeof row["name"] === "string" ? row["name"] : "Evidence";
                          const href = typeof row["url"] === "string" ? safeHttpHref(row["url"]) : null;
                          return <p key={index} className="text-xs text-body">
                            {href && row["kind"] === "LINK" ?
                              <a href={href} rel="noopener noreferrer" target="_blank"
                                className="text-link hover:underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Open link · {name}</a> :
                              row["kind"] === "FILE" && typeof row["fileId"] === "string"
                                ? <ProjectDeliveryEvidenceDownload projectId={workspace.project.id}
                                    fileId={row["fileId"]} name={name}/>
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
                            rel="noopener noreferrer"
                            className="text-link hover:text-[var(--lms-primary-text)]"
                          >
                            Open source ↗
                          </a>
                        ) : null}
                        {demo ? (
                          <a
                            href={demo}
                            rel="noopener noreferrer"
                            className="text-link hover:text-[var(--lms-primary-text)]"
                          >
                            Open demo ↗
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {review ? (
                      <div className="mt-4 border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-3 py-2">
                        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Review · {label(review.decision)}
                        </p>
                        {review.feedback ? (
                          <p className="mt-1 text-sm leading-6 text-body">
                            {review.feedback}
                          </p>
                        ) : null}
                      </div>
                    ) : mode === "ADMIN" ? <p className="mt-3 text-sm text-muted-foreground">
                      No mentor feedback has been recorded yet.
                    </p> : null}

                    {mode!=="LEARNER"?<Disclosure title="Submission history" className="mt-3 border-t border-[var(--lms-canvas-border)] pt-3">
                      <ul className="mt-2 space-y-2 text-xs text-body">
                        {workspace.activity.filter(event=>event.subjectId===submission.id&&
                          event.eventType.includes("delivery")).map(event=>
                            <li key={event.id} className="border-l-2 border-border pl-2">
                              {event.summary} · {event.actorDisplayName??"System"} · {formatDateTime(event.occurredAt)}
                            </li>)}
                        {submission.reopenedAt?<li>Reopened · {formatDateTime(submission.reopenedAt)}</li>:null}
                        {submission.lockedAt?<li>Locked · {formatDateTime(submission.lockedAt)}</li>:null}
                      </ul>
                    </Disclosure>:null}
                    {mode === "ADMIN" && !readOnly &&
                      (submission.status === "SUBMITTED" || submission.status === "APPROVED") ? (
                      <ProjectAdminSubmissionReview projectId={workspace.project.id}
                        submissionId={submission.id} status={submission.status}
                        locked={Boolean(submission.lockedAt)}
                        projectStatus={workspace.project.status} allowLock={false}/>
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
                      <div className="mt-3 border-l-[3px] border-success bg-[var(--lms-success-subtle)] px-3 py-2">
                        <p className="m-0 text-sm font-semibold text-success">
                          Evaluation ·{" "}
                          {evaluation.totalScore}/
                          {evaluation.maxScore}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
                return historical?
                  <Disclosure key={submission.id}
                    title={"Earlier submission · version "+submission.version+
                      " · "+label(submission.status)}
                    className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-3">
                    {content}
                  </Disclosure>:content;
              },
            )}
          </div>
        )}
      </section> : null}

      <div className={activeSection ? "grid min-w-0 gap-6" : "grid min-w-0 gap-6 xl:grid-cols-2"}>
        {show("resources") ? <section className="space-y-3">
          {!(mode==="ADMIN"&&!readOnly)?<div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {mode==="ADMIN"?<p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">
                Project references</p>:null}
              <h2 className="m-0 text-lg font-semibold text-foreground">
                {mode==="ADMIN"?"Resource library":"Resources"}
              </h2>
              {mode==="ADMIN"?<p className="mt-1 text-sm text-body">
                Curate the references, files and access guidance this workspace team needs.
              </p>:null}
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
          </div>:null}
          {mode==="ADMIN"&&!readOnly?<ProjectResourceLibraryEditor
            projectId={workspace.project.id}
            token={projectResourceLibraryToken(workspace.resources)}
            resources={workspace.resources}/>:null}
          <ProjectResourceList projectId={workspace.project.id} rows={workspace.resources}
            mode={mode} readOnly={readOnly}
            sprints={workspace.sprints.map(item=>({id:item.id,label:item.title}))}
            tasks={workspace.tasks.map(item=>({id:item.id,label:item.title}))}/>
          {mode==="ADMIN"?<p className="text-xs text-body">
            Resources are shared with the workspace team.
          </p>:null}
          <ProjectResourceFilesSection
            projectId={workspace.project.id}
            resources={workspace.resources.filter(item=>item.status==="ACTIVE")
              .map(item=>({id:item.id,title:item.title,visibility:item.visibility}))}
            mode={mode}
            status={workspace.project.status}
            currentMembershipId={currentMembershipId}
          />
        </section> : null}

        {show("meetings") ? <section className="space-y-3">
          {workspace.meetingsLoadError?<div role="alert"
            className="border-l-2 border-error bg-error-subtle p-3 text-sm text-body">
            <p className="font-semibold text-foreground">Workspace meetings could not be loaded</p>
            <p className="mt-1">Meeting records are temporarily unavailable.
              The other loaded project sections remain accessible.</p>
            <Link href="?retry=1" className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
              Retry meetings
            </Link>
          </div>:null}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {mode==="ADMIN"?<p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">
                Team cadence</p>:null}
              <h2 className="m-0 text-lg font-semibold text-foreground">
                {mode==="ADMIN"?"Meeting plan":"Meetings"}
              </h2>
              <p className="mt-1 text-sm text-body">
                {mode==="ADMIN"?"Plan project touchpoints and connect conversations to the work they support.":
                  mode==="LEARNER"?"Upcoming meetings and recent history.":
                  "Keep project conversations attached to the work they move forward."}
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
                tasks={workspace.tasks.filter(task=>!task.deletedAt).map(task=>({
                  id: task.id,
                  label: task.title,
                  sprintId: task.sprintId,
                }))}
              />
            ) : null}
          </div>
          {mode === "ADMIN" && !readOnly && !workspace.meetingsLoadError &&
            ["PLANNED", "ACTIVE"].includes(workspace.project.status) ? (
            <ProjectMeetingPlanEditor projectId={workspace.project.id}
              meetingsToken={projectMeetingPlanToken(workspace.meetings)}
              meetings={workspace.meetings.filter(meeting => !meeting.deletedAt).map(meeting => ({
                id:meeting.id,status:meeting.status,title:meeting.title,
                meetingKey:meeting.meetingKey,meetingType:meeting.meetingType,
                meetingUrl:meeting.meetingUrl,outcome:meeting.outcome,
                agenda: meeting.agenda, startsAt: meeting.startsAt.toISOString(),
                endsAt: meeting.endsAt.toISOString(), linkedSprintId: meeting.linkedSprintId,
                linkedTaskId: meeting.linkedTaskId,
              }))}
              sprints={workspace.sprints.map(sprint => ({
                id: sprint.id, title: sprint.title,
              }))}
              tasks={workspace.tasks.filter(task => !task.deletedAt).map(task => ({
                id: task.id, title: task.title, sprintId: task.sprintId,
              }))} />
          ) : null}
          {mode==="ADMIN"?<p className="border-b border-border pb-3 text-xs text-body">
            Calendar sync and automatic reminders are not enabled. Follow-up notes and status are saved with each meeting.
          </p>:null}
          {mode==="MENTOR" && workspace.meetings.length ? (() => {
            const upcoming=workspace.meetings.filter(m=>(m.status==="SCHEDULED"||m.status==="RESCHEDULED")&&new Date(m.endsAt)>renderTime)
              .sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime());
            return <section aria-label="Upcoming project meetings" className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
              <h3 className="text-sm font-semibold">Next meeting</h3>
              {upcoming[0]?<p className="mt-1 text-sm">
                {upcoming[0].title} · {formatDateTime(upcoming[0].startsAt)}
                {upcoming[0].meetingType?" · "+label(upcoming[0].meetingType):""}
              </p>:
                <p className="mt-1 text-sm text-muted-foreground">No upcoming meeting.</p>}
              {upcoming.length>1?<Disclosure title={`Also scheduled (${upcoming.length-1})`} className="mt-2 text-sm">
                <ul className="mt-2 space-y-1">{upcoming.slice(1).map(m=>
                  <li key={m.id}>{m.title} · {formatDateTime(m.startsAt)}
                    {m.meetingType?" · "+label(m.meetingType):""}</li>)}</ul>
              </Disclosure>:null}
              <MentorMeetingHistory {...(mode==="MENTOR"?{projectId:workspace.project.id}:{})} meetings={workspace.meetings
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
            {workspace.meetings.length === 0 && !workspace.meetingsLoadError ? (
              <EmptyState title="No meetings yet."
                description={mode==="ADMIN"?
                  "No meetings yet. Add one when the team needs a planned touchpoint.":
                  "No project meetings have been recorded."} />
            ) : (
              workspace.meetings.map((meeting) => {
                const href = safeHttpHref(
                  meeting.meetingUrl,
                );
                return (
                  <article
                    key={meeting.id}
                    id={"meeting-"+meeting.id}
                    className="min-w-0 scroll-mt-20 border-b border-[var(--lms-canvas-border)] py-4"
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
                      <div className="grid justify-items-end gap-1">
                        <span className="text-xs text-muted-foreground">Meeting status</span>
                        <StatusBadge
                          tone={tone(mentorMeetingDisplayStatus(meeting.status, meeting.endsAt, renderTime))}
                        >
                          {label(mentorMeetingDisplayStatus(meeting.status, meeting.endsAt, renderTime))}
                        </StatusBadge>
                      </div>
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
                    {meeting.linkedSprintId ? (
                      <p className="mt-2 text-xs text-body">
                        <strong>Linked sprint: </strong>
                        {workspace.sprints.find(item=>item.id===meeting.linkedSprintId)?.title
                          ??"Linked sprint unavailable"}
                      </p>
                    ) : null}
                    {meeting.linkedTaskId ? (
                      <p className="mt-1 text-xs text-body">
                        <strong>Linked task: </strong>
                        {workspace.tasks.find(item=>item.id===meeting.linkedTaskId)?.title
                          ??"Linked task unavailable"}
                      </p>
                    ) : null}
                    {meeting.agenda ? (
                      <section aria-label="Meeting agenda"
                        className="mt-2 min-w-0 border-b border-[var(--lms-canvas-border)] pb-2">
                        <h4 className="text-sm font-semibold">Agenda</h4>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-body">
                          {meeting.agenda}
                        </p>
                      </section>
                    ) : null}
                    {meeting.outcome ? (
                      <p className="mt-2 border-l-2 border-[var(--lms-canvas-border)] pl-3 text-sm leading-6 text-body">
                        Outcome: {meeting.outcome}
                      </p>
                    ) : null}
                    {mode==="MENTOR"?(()=>{
                      const detail=mentorMeetingFacilitationSchema.parse(meeting.facilitation??{});
                      const hasNotes=Boolean(detail.notes||detail.actionItems||detail.actionItemRows.length);
                      const hasRetro=Boolean(detail.wentWell||detail.retroDidntGoWell||
                        detail.improve||detail.nextTime||detail.retroActions.length);
                      const hasFollowUp=Boolean(detail.followUpAt||detail.followUpNotes||
                        detail.followUpStatus!=="NOT_PLANNED");
                      return hasNotes||hasRetro||hasFollowUp?<Disclosure
                        title="Meeting notes, retrospective and follow-ups"
                        className="mt-2 border-t border-[var(--lms-canvas-border)] pt-3 text-sm">
                        {hasNotes?<section aria-label="Meeting notes and action items"
                          className="min-w-0 border-b border-[var(--lms-canvas-border)] py-2">
                          <h4 className="text-sm font-semibold">Notes and action items</h4>
                          {([["Notes",detail.notes],["Action items",detail.actionItems]] as const)
                            .filter(([,value])=>Boolean(value)).map(([field,value])=>
                              <p key={field} className="mt-2 whitespace-pre-wrap break-words">
                                <strong>{field}: </strong>{value}</p>)}
                          {detail.actionItemRows.length>0?
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                              {detail.actionItemRows.map((row,index)=>
                                <li key={index} className="break-words">
                                  {row.text}{row.owner?" · "+row.owner:""}{row.complete?" · Done":""}
                                </li>)}</ul>:null}
                        </section>:null}
                        {hasRetro?<section aria-label="Retrospective"
                          className="min-w-0 border-b border-[var(--lms-canvas-border)] py-2">
                          <h4 className="text-sm font-semibold">Retrospective</h4>
                          {([
                            ["What went well?",detail.wentWell],
                            ["What didn't go well?",detail.retroDidntGoWell],
                            ["What could improve?",detail.improve],
                            ["What to try next?",detail.nextTime],
                          ] as const).filter(([,value])=>Boolean(value)).map(([field,value])=>
                            <p key={field} className="mt-2 whitespace-pre-wrap break-words">
                              <strong>{field}: </strong>{value}</p>)}
                          {detail.retroActions.length>0?
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                              {detail.retroActions.map((row,index)=>
                                <li key={index} className="break-words">
                                  {row.text}{row.complete?" · Done":""}
                                </li>)}</ul>:null}
                        </section>:null}
                        {hasFollowUp?<section aria-label="Meeting follow-up" className="min-w-0 py-2">
                          <h4 className="text-sm font-semibold">Follow-up</h4>
                          <p className="mt-2 text-sm">
                            <strong>Follow-up status: </strong>{label(detail.followUpStatus)}
                          </p>
                          {detail.followUpAt?<p className="mt-2">
                            <strong>Follow-up at (IST): </strong>
                            {formatDateTime(new Date(detail.followUpAt))}
                          </p>:null}
                          {detail.followUpNotes?<p className="mt-2 whitespace-pre-wrap break-words">
                            <strong>Follow-up notes: </strong>{detail.followUpNotes}
                          </p>:null}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Automatic meeting reminders and calendar sync are not enabled.
                          </p>
                        </section>:null}
                      </Disclosure>:null;
                    })():null}
                    {mode==="MENTOR"? (
                      <Link
                        href={"/mentor/projects/"+encodeURIComponent(workspace.project.id)+
                          "/meetings/"+encodeURIComponent(meeting.id)+"/notes"}
                        className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline">
                        {meeting.outcome?"View notes":"Add notes"}
                      </Link>
                    ) : null}
                    {href && meeting.status!=="CANCELLED" && meeting.status!=="COMPLETED" && mentorMeetingDisplayStatus(meeting.status,meeting.endsAt,renderTime)!=="MISSED" ? (
                      <a
                        href={href}
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-link hover:text-[var(--lms-primary-text)]"
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
            {mode==="ADMIN"?<p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">
              Resource activity</p>:null}
            <h2 className="m-0 text-lg font-semibold text-foreground">
              {mode==="ADMIN"?"See who changed project resources and when":"Activity"}
            </h2>
            <p className="mt-1 text-sm text-body">
              {mode==="ADMIN"?
                "Trace resource changes here, or open the full project audit trail for broader events.":
                "Task moves, sprint updates and resource changes from your project."}
            </p>
          </div>

          {mode === "ADMIN" ? <Link href={(backHref.startsWith("/college/") ? "/college/projects/audit" : "/admin/projects/audit") + "?entityId=" + encodeURIComponent(workspace.project.id) + "&range=all"}
            className="inline-flex min-h-11 md:min-h-9 items-center gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-3 text-sm font-semibold text-link hover:bg-primary-subtle">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></svg>
              View audit trail</Link> : null}
          {mode==="ADMIN"&&workspace.activityLoadError?
            <div role="alert" className="border-l-[3px] border-warning-border bg-warning-subtle p-3 text-sm">
              <p className="font-semibold">Resource audit could not be loaded.</p>
              <p className="mt-1 text-body">The workspace remains available. Retry the audit without losing the project context.</p>
              <Link href="?retry=1" className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
                Retry workspace audit
              </Link>
            </div>:null}
          {mode==="ADMIN"&&!workspace.activityLoadError?
            <ProjectResourceAuditList events={workspace.activity.map(event => ({
            id: event.id, eventType: event.eventType, summary: event.summary,
            subjectLabel: event.subjectLabel, actorDisplayName: event.actorDisplayName,
            actorType:event.actorType,
            occurredAt: event.occurredAt.toISOString(),
          }))} /> : null}
          {!workspace.activityLoadError&&mode!=="ADMIN"?<ProjectActivityFilteredList
            projectId={workspace.project.id} events={workspace.activity}
            now={new Date().toISOString()} />:null}


        </section>
      ) : null}
    </div>
  );
}
