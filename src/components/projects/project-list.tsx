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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={basePath + "/" + item.id}
          className="group flex min-h-56 flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {item.participation ? (
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                  {item.participation}
                </p>
              ) : (
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                  Project workspace
                </p>
              )}
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
                {item.title}
              </h2>
            </div>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {statusLabel(item.status)}
            </StatusBadge>
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-body">
            {item.summary ??
              "Project execution workspace with team, sprints, tasks, delivery and review history."}
          </p>

          {(item.mentorName || item.memberCount !== undefined || item.progressPercent !== undefined) ? (
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-xs">
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
                  {item.progressPercent ?? 0}%
                </p>
              </div>
            </div>
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
              className="text-lg text-primary-text transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
