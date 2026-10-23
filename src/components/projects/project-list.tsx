import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export type ProjectListItem = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  updatedAt: Date;
  participation?: string | null;
  mentorName?: string | null;
  memberCount?: number;
  progressPercent?: number;
  progressDetail?: string;
  readOnlyLabel?: string | null;
  attention?: readonly string[];
  actionLine?: string;
  dueState?: string;
  phaseLabel?:string;
  courseLabel?: string | null;
  phase?: string | null;
  dueLabel?: string | null;
  dueDate?: string | null;
  blockedHref?: string;
  blockerText?: string;
  href?: string;
};

function statusTone(status: string) {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return "success" as const;
    case "PLANNED":
      return "info" as const;
    case "ARCHIVED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function ProjectList({
  items,
  basePath,
  emptyTitle,
  emptyDescription,
}: {
  items: readonly ProjectListItem[];
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  if (basePath === "/mentor/projects") {
    // 42LMS screen 45, Mentor › Projects: use a true list/table instead of
    // learner's progress cards. Display only data actually authorized and
    // present in ProjectListItem; never invent sprint or student counts.
    return (
      <section className="prototype-mentor-team-table" aria-label="Your teams">
        <div className="prototype-mentor-table-top">
          <h2>Your teams</h2>
          <span>{items.length} {items.length === 1 ? "team" : "teams"}</span>
        </div>
        <div className="prototype-mentor-table-head" aria-hidden="true">
          <span>Team and project</span>
          <span>Students</span>
          <span>Sprints</span>
          <span>Tasks done</span>
          <span>Last activity</span>
          <span>How it’s going</span>
        </div>
        <div className="prototype-mentor-table-body">
          {items.map(item => {
            const completion = Number.isFinite(item.progressPercent)
              ? Math.min(100, Math.max(0, Math.round(item.progressPercent ?? 0)))
              : null;
            const issue = item.attention?.find(label => /blocked|stalled|risk|review|sign.off/i.test(label));
            const state = issue ?? statusLabel(item.status);
            const stateTone = /blocked|stalled/i.test(state) ? "bad"
              : /risk|review|sign.off/i.test(state) ? "warn"
              : item.status === "COMPLETED" ? "ok" : "info";
            const updated = new Intl.DateTimeFormat("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              timeZone: "Asia/Kolkata",
            }).format(item.updatedAt);
            return (
              <Link key={item.id}
                href={item.href ?? basePath + "/" + encodeURIComponent(item.id)}
                className="prototype-mentor-table-row"
                aria-label={item.title + ". " + state + ". Open project."}
              >
                <span className="prototype-mentor-project-name">
                  <strong>{item.title}</strong>
                  <small>{item.courseLabel || item.summary || "Project"}</small>
                </span>
                <span className="prototype-mentor-table-numeric">
                  {item.memberCount !== undefined ? item.memberCount : "—"}
                </span>
                <span className="prototype-mentor-table-detail">
                  {item.phaseLabel || item.phase || "Not recorded"}
                  {item.dueState ? <small>{item.dueState}</small> : null}
                </span>
                <span className="prototype-mentor-table-detail">
                  {completion === null ? "Not tracked" : completion + "%"}
                  {completion !== null ? (
                    <span role="progressbar" aria-label={"Project progress for " + item.title}
                      aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}
                      className="prototype-mentor-progress-track">
                      <span style={{width: completion + "%"}} />
                    </span>
                  ) : null}
                </span>
                <span className="prototype-mentor-table-detail">{updated}</span>
                <span className={"prototype-mentor-state prototype-mentor-state-" + stateTone}>
                  <span className="prototype-mentor-state-dot" aria-hidden="true" />
                  {state}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (basePath === "/learn/projects") {
    return <div className="grid min-w-0 gap-4 sm:grid-cols-2" aria-label="Assigned project workspaces">
      {items.map(item=>{
        const archived=item.status==="ARCHIVED";
        const blocked=!archived&&(Boolean(item.blockerText)||item.attention?.includes("Blocked"));
        const needsReview=!archived&&!blocked&&item.attention?.some(label=>/review/i.test(label));
        const stalled=!archived&&!blocked&&!needsReview&&item.attention?.some(label=>/stall/i.test(label));
        const notice=archived?"Archived":blocked?"Blocked":needsReview?"Needs review":stalled?"Stalled":
          item.status==="ACTIVE"?"Active":statusLabel(item.status);
        const completion=Math.min(100,Math.max(0,Math.round(item.progressPercent??0)));
        const course=item.courseLabel?.trim()||"Project";
        const mentor=item.mentorName?.trim()||"Mentor";
        return <Link key={item.id} href={item.href??basePath+"/"+encodeURIComponent(item.id)}
          className="group flex min-w-0 flex-col rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:p-5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className={"inline-flex max-w-full items-center rounded px-2 py-0.5 text-xs font-semibold "+
              (archived?"bg-muted text-muted-foreground":stalled?"bg-error-subtle text-error":
                blocked?"bg-warning-subtle text-warning-text":needsReview?"bg-warning-subtle text-warning-text":
                item.status==="ACTIVE"?"bg-[#e6f9fa] text-[#228e99]":"bg-primary-subtle text-primary-text")}>
              {notice}
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24"
              className="size-4 shrink-0 text-primary-text transition-transform group-hover:translate-x-0.5"
              fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6"/>
            </svg>
          </div>
          <h2 className="mt-2 line-clamp-2 break-words text-base font-semibold leading-6 text-foreground">
            {item.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-body">
            {course} <span aria-hidden="true"> • </span> {mentor}
          </p>
          {item.summary?<p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</p>:null}
          <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-body">
            <span>Phase: {item.phaseLabel||item.phase||statusLabel(item.status)}</span>
            <span>{item.dueState||item.dueLabel||"No due date"}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--lms-neutral-100)]"
            role="progressbar" aria-label={"Project progress for "+item.title} aria-valuemin={0}
            aria-valuemax={100} aria-valuenow={completion}>
            <span className="block h-full rounded-full bg-[#2db7c4]" style={{width:completion+"%"}}/>
          </div>
          <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
            {completion}% complete
          </p>
          {item.blockerText&&!archived?<p className="mt-2 line-clamp-2 text-xs text-warning-text">
            Blocker: {item.blockerText}
          </p>:null}
          <div className="mt-auto pt-4">
            <p className="text-sm font-semibold text-foreground">
              {item.actionLine||"Open workspace"}
            </p>
            <span className="mt-1 inline-flex min-h-9 items-center text-xs font-semibold text-link">
              Open workspace <span aria-hidden="true" className="ml-1">→</span>
            </span>
          </div>
        </Link>;
      })}
    </div>;
  }

  return (
    <div className={basePath==="/learn/projects"||basePath==="/mentor/projects"?"min-w-0 divide-y divide-border":"grid min-w-0 gap-4 min-[992px]:grid-cols-2 min-[1366px]:grid-cols-3"}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href ?? basePath + "/" + item.id}
          className={basePath==="/learn/projects"||basePath==="/mentor/projects"?"group flex min-w-0 flex-col py-4 first:pt-0 last:pb-0 transition-colors hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:py-5":"group flex min-h-56 flex-col rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 transition-shadow duration-200 hover:border-primary hover:bg-[rgba(38,186,199,0.045)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {item.participation ? (
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-link">
                  {item.participation}
                </p>
              ) : (
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-link">
                  Project
                </p>
              )}
              <h2 className="mt-1 line-clamp-2 break-words text-lg font-semibold text-foreground">
                {item.title}
              </h2>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <StatusBadge
                tone={statusTone(item.status)}
              >
                {statusLabel(item.status)}
              </StatusBadge>
              {item.readOnlyLabel ? (
                <StatusBadge tone="neutral">{item.readOnlyLabel}</StatusBadge>
              ) : null}
              {item.attention?.map((label) => (
                <StatusBadge
                  key={label}
                  tone="warning"
                >
                  {label}
                </StatusBadge>
              ))}
            </div>
          </div>

          {item.courseLabel || item.phase || item.dueLabel ? (
            <p className="mt-2 text-xs font-semibold text-body">
              {item.courseLabel ?? "Project"}{item.mentorName ? " • " + item.mentorName : basePath==="/mentor/projects" ? "" : " • Mentor not assigned"}
              {item.phase ? " · " + item.phase : ""}
              {item.dueLabel ? " · " + item.dueLabel : ""}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-body">
            {item.summary ??
              "Project workspace."}
          </p>

          {(item.mentorName || item.memberCount !== undefined || item.progressPercent !== undefined) ? (
            <div className="mt-3 grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 border-y border-border py-3 text-xs md:grid-cols-3 [&>*]:min-w-0">
              <div>
                <p className="m-0 font-semibold text-muted-foreground">Mentor</p>
                <p className="mt-1 break-words font-semibold text-foreground">
                  {item.mentorName ?? "Unassigned"}
                </p>
              </div>
              <div>
                <p className="m-0 font-semibold text-muted-foreground">Members</p>
                <p className="mt-1 font-semibold text-foreground">
                  {item.memberCount ?? 0}
                </p>
              </div>
              <div>
                <p className="m-0 font-semibold text-muted-foreground">Progress</p>
                <p className="mt-1 font-semibold text-foreground">
                  {item.progressPercent === undefined ? "Not tracked" : item.progressPercent + "%"}
                </p>
                {item.progressDetail ? (
                  <p className="mt-1 text-xs leading-4 text-muted-foreground">
                    {item.progressDetail}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {basePath==="/learn/projects"?<div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-body">
            <span>Phase: {item.phaseLabel??statusLabel(item.status)}</span>
            <span aria-label="Project due status">· {item.dueState??"No due date"}{item.dueDate?" · "+item.dueDate:""}</span>
          </div> : item.dueState ? <div className="mt-3 text-xs font-semibold text-body">Due: {item.dueState}{item.dueDate ? " · " + item.dueDate : ""}</div> : null}
          {item.blockedHref ? (
            <span className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-warning-text">
              Blocked · Open blocked work →
            </span>
          ) : null}
          {item.actionLine ? (
            <p className="mt-3 text-sm font-semibold text-link">{item.actionLine} →</p>
          ) : null}
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <p className="m-0 text-xs text-muted-foreground">
              Updated{" "}
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
              }).format(item.updatedAt)}
            </p>
            <span
              aria-hidden="true"
              className="text-lg text-link transition-transform group-hover:translate-x-0.5"
            >
              <span className="sr-only">Open workspace</span>→
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
