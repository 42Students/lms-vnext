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

  return (
    <div className="grid min-w-0 gap-4 min-[992px]:grid-cols-2 min-[1366px]:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href ?? basePath + "/" + item.id}
          className="group flex min-h-56 flex-col rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 transition-shadow duration-200 hover:border-primary hover:shadow-[var(--lms-shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
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
              {item.courseLabel ?? "Project"} • {item.mentorName ?? "Mentor not assigned"}
              {item.phase ? " · " + item.phase : ""}
              {item.dueLabel ? " · " + item.dueLabel : ""}
            </p>
          ) : null}
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-body">
            {item.summary ??
              "Project workspace."}
          </p>

          {(item.mentorName || item.memberCount !== undefined || item.progressPercent !== undefined) ? (
            <div className="mt-4 grid min-w-0 grid-cols-1 divide-y divide-border border-y border-border py-3 text-xs min-[768px]:grid-cols-3 min-[768px]:divide-x min-[768px]:divide-y-0 [&>*]:min-w-0 [&>*]:px-2 [&>*]:py-2 min-[768px]:[&>*]:py-0">
              <div>
                <p className="m-0 font-semibold text-muted-foreground">Mentor</p>
                <p className="mt-1 truncate font-semibold text-foreground">
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
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
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
