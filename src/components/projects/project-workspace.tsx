import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  getProjectWorkspaceView,
} from "@/modules/projects/workspace-view-service";

type Workspace = Awaited<
  ReturnType<typeof getProjectWorkspaceView>
>;

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
}: {
  workspace: Workspace;
  backHref: string;
  backLabel: string;
  eyebrow: string;
}) {
  const { readiness } = workspace;
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

      <PageHeader
        eyebrow={eyebrow}
        title={workspace.project.title}
        description={
          workspace.project.summary ??
          "Project workspace for execution, review and final delivery."
        }
        actions={
          <StatusBadge
            tone={tone(workspace.project.status)}
          >
            {label(workspace.project.status)}
          </StatusBadge>
        }
      />

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

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Team
          </h2>
          <p className="mt-1 text-sm text-body">
            Canonical college memberships with explicit
            Project responsibility.
          </p>
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
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
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
                <StatusBadge tone={tone(release.status)}>
                  {label(release.status)}
                </StatusBadge>
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
                      <StatusBadge
                        tone={tone(sprint.status)}
                      >
                        {label(sprint.status)}
                      </StatusBadge>
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
      </section>

      <section className="space-y-3">
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
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              Resources
            </h2>
            <p className="mt-1 text-sm text-body">
              Template and runtime links available to the
              Project team.
            </p>
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
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              Meetings
            </h2>
            <p className="mt-1 text-sm text-body">
              Requested, scheduled and completed Project
              conversations.
            </p>
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
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
