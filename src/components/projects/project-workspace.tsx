import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectArchiveControl } from "./project-archive-control";
import { StatusBadge } from "@/components/ui/status-badge";
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
import {
  CreateProjectResourceControl,
  ProjectResourceActions,
} from "./project-resource-controls";
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
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ||
      url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatDateTime(value: Date | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ProjectWorkspace({
  workspace,
  backHref,
  backLabel,
  eyebrow,
  mode,
  currentMembershipId,
  activeSection,
  sectionBaseHref,
}: {
  workspace: Workspace;
  backHref: string;
  backLabel: string;
  eyebrow: string;
  mode: "LEARNER" | "MENTOR" | "ADMIN";
  currentMembershipId: string | null;
  activeSection?: ProjectWorkspaceSection;
  sectionBaseHref?: string;
}) {
  const { readiness } = workspace;
  const show = (section: ProjectWorkspaceSection) =>
    !activeSection || activeSection === section;
  const tasksBySprint = new Map<
    string,
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
        ← {backLabel}
      </Link>

      {sectionBaseHref ? (
        <nav
          aria-label="Project workspace sections"
          className="flex gap-2 overflow-x-auto border-b border-border pb-3"
        >
          {PROJECT_WORKSPACE_SECTIONS.map((section) => (
            <Link
              key={section}
              href={sectionBaseHref + "/" + section}
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
        eyebrow={eyebrow}
        title={workspace.project.title}
        description={
          workspace.project.summary ??
          "Project workspace for execution, review and final delivery."
        }
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
              />
            ) : null}
          </div>
        }
      />

      {show("summary") || show("readiness") ? (
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
            label="Final delivery"
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
                Your final delivery
              </h2>
              <p className="mt-1 text-sm text-body">
                Prepare the final draft early; submit it after all execution work is complete.
              </p>
            </div>
            <LearnerFinalDeliveryControl
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
            />
          </div>
        </section>
      ) : null}

      {show("overview") ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Overview
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
            {workspace.project.summary ??
              "No project overview has been recorded yet."}
          </p>
        </section>
      ) : null}

      {show("team") ? <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              Team
            </h2>
            <p className="mt-1 text-sm text-body">
              Canonical college memberships with explicit
              Project responsibility.
            </p>
          </div>
          {mode === "ADMIN" ? (
            <AddProjectMemberControl
              projectId={workspace.project.id}
            />
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspace.members.map((member) => (
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
              {mode === "ADMIN" ? (
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
          ))}
        </div>
      </section> : null}

      {show("sprints") || show("tasks") ? <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Execution
          </h2>
          <p className="mt-1 text-sm text-body">
            Release → sprint → task state from normalized
            Project records.
          </p>
        </div>
        <div className="space-y-4">
          {workspace.releases.map((release) => (
            <article
              key={release.id}
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
                  {mode !== "LEARNER" ? (
                    <ReleaseLifecycleActions
                      projectId={workspace.project.id}
                      releaseId={release.id}
                      status={release.status}
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
                        {sprint.description ? (
                          <p className="mt-1 text-xs leading-5 text-body">
                            {sprint.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={tone(sprint.status)}
                        >
                          {label(sprint.status)}
                        </StatusBadge>
                        {mode !== "LEARNER" ? (
                          <SprintLifecycleActions
                            projectId={workspace.project.id}
                            sprintId={sprint.id}
                            status={sprint.status}
                            releaseStatus={release.status}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {(tasksBySprint.get(sprint.id) ??
                        []).map((task) => {
                        const attempts =
                          taskSubmissions.get(
                            task.id,
                          ) ?? [];
                        const latestAttempt =
                          attempts.at(-1) ?? null;
                        return (
                          <div
                            key={task.id}
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
                            {mode === "LEARNER" &&
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
                            {mode !== "LEARNER" ? (
                              <div className="mt-3 flex flex-wrap items-end gap-2">
                                <TaskLifecycleActions
                                  projectId={workspace.project.id}
                                  taskId={task.id}
                                  status={task.status}
                                  sprintStatus={sprint.status}
                                />
                                {latestAttempt?.status ===
                                  "SUBMITTED" &&
                                task.status ===
                                  "IN_REVIEW" ? (
                                  <TaskReviewActions
                                    projectId={workspace.project.id}
                                    taskId={task.id}
                                    submissionId={
                                      latestAttempt.id
                                    }
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
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Final delivery
          </h2>
          <p className="mt-1 text-sm text-body">
            Versioned submissions, immutable review history
            and rubric evaluation.
          </p>
        </div>
        {workspace.finalDelivery.submissions.length ===
        0 ? (
          <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
            No final submission version yet.
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

                    {mode !== "LEARNER" &&
                    submission.status ===
                      "SUBMITTED" ? (
                      <div className="mt-3">
                        <FinalReviewControl
                          projectId={workspace.project.id}
                          submissionId={submission.id}
                        />
                      </div>
                    ) : null}

                    {mode !== "LEARNER" &&
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
              <p className="mt-1 text-sm text-body">
                Template and runtime links available to the
                Project team.
              </p>
            </div>
            {mode !== "LEARNER" ? (
              <CreateProjectResourceControl
                projectId={workspace.project.id}
              />
            ) : null}
          </div>
          <div className="space-y-3">
            {workspace.resources.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
                No active resources.
              </div>
            ) : (
              workspace.resources.map((resource) => {
                const href = safeHttpHref(
                  resource.url,
                );
                return (
                  <article
                    key={resource.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="m-0 font-semibold text-foreground">
                          {resource.title}
                        </p>
                        {resource.description ? (
                          <p className="mt-1 text-sm leading-6 text-body">
                            {resource.description}
                          </p>
                        ) : null}
                      </div>
                      {resource.required ? (
                        <StatusBadge tone="warning">
                          Required
                        </StatusBadge>
                      ) : null}
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
                      >
                        Open resource ↗
                      </a>
                    ) : null}
                    {mode !== "LEARNER" ? (
                      <ProjectResourceActions
                        projectId={workspace.project.id}
                        resource={{
                          id: resource.id,
                          title: resource.title,
                          description:
                            resource.description,
                          url: resource.url,
                          required:
                            resource.required,
                        }}
                      />
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section> : null}

        {show("meetings") ? <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-semibold text-foreground">
                Meetings
              </h2>
              <p className="mt-1 text-sm text-body">
                Requested, scheduled and completed Project
                conversations.
              </p>
            </div>
            {mode === "LEARNER" ? (
              <RequestProjectMeetingControl
                projectId={workspace.project.id}
              />
            ) : (
              <ScheduleProjectMeetingControl
                projectId={workspace.project.id}
                sprints={workspace.sprints.map(
                  (sprint) => ({
                    id: sprint.id,
                    label: sprint.title,
                  }),
                )}
                tasks={workspace.tasks.map(
                  (task) => ({
                    id: task.id,
                    label: task.title,
                    sprintId: task.sprintId,
                  }),
                )}
              />
            )}
          </div>
          <div className="space-y-3">
            {workspace.meetings.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
                No meetings yet.
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
                          {formatDateTime(
                            meeting.startsAt,
                          )}{" "}
                          · {meeting.timeZone}
                        </p>
                      </div>
                      <StatusBadge
                        tone={tone(meeting.status)}
                      >
                        {label(meeting.status)}
                      </StatusBadge>
                    </div>
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
                    {href ? (
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
                    (meeting.status === "REQUESTED" ||
                      meeting.status === "SCHEDULED") ? (
                      <div className="mt-3">
                        <ScheduleProjectMeetingControl
                          projectId={workspace.project.id}
                          meeting={meeting}
                          sprints={workspace.sprints.map(
                            (sprint) => ({
                              id: sprint.id,
                              label: sprint.title,
                            }),
                          )}
                          tasks={workspace.tasks.map(
                            (task) => ({
                              id: task.id,
                              label: task.title,
                              sprintId: task.sprintId,
                            }),
                          )}
                        />
                      </div>
                    ) : null}
                    <ProjectMeetingTransitionActions
                      projectId={workspace.project.id}
                      meeting={meeting}
                      mode={mode}
                      currentMembershipId={
                        currentMembershipId
                      }
                    />
                  </article>
                );
              })
            )}
          </div>
        </section> : null}
      </div>

      {show("audit") ? (
        <section className="rounded-xl border border-warning-border bg-warning-subtle p-5">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Project audit
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            Project audit history is not available yet. DB07 immutable audit tables
            are staged, but W01 must register and replay the shared migration before
            this route can truthfully expose the legacy audit timeline.
          </p>
        </section>
      ) : null}
    </div>
  );
}
