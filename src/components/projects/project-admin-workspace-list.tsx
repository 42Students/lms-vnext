import Link from "next/link";
import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export type ProjectAdminWorkspaceListItem = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  updatedAt: Date;
  mentorName: string | null;
  memberCount: number;
  progressPercent: number;
};

function tone(status: string) {
  if (
    status === "ACTIVE" ||
    status === "COMPLETED"
  ) {
    return "success" as const;
  }
  if (status === "PLANNED") {
    return "info" as const;
  }
  return "neutral" as const;
}

function label(status: string) {
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

export function ProjectAdminWorkspaceList({
  items,
  basePath,
  emptyTitle,
  emptyDescription,
}: {
  items: readonly ProjectAdminWorkspaceListItem[];
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!items.length) {
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
        <article
          key={item.id}
          className="flex min-h-60 flex-col rounded-xl border border-border bg-surface p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                Project workspace
              </p>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
                {item.title}
              </h2>
            </div>
            <StatusBadge
              tone={tone(item.status)}
            >
              {label(item.status)}
            </StatusBadge>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-body">
            {item.summary ??
              "Project execution workspace with team, sprints, tasks, delivery and review history."}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-xs">
            <Metric
              label="Mentor"
              value={
                item.mentorName ??
                "Unassigned"
              }
            />
            <Metric
              label="Members"
              value={String(
                item.memberCount,
              )}
            />
            <Metric
              label="Progress"
              value={
                item.progressPercent +
                "%"
              }
            />
          </div>

          <p className="mb-0 mt-3 text-xs text-muted-foreground">
            Updated{" "}
            {new Intl.DateTimeFormat(
              "en-IN",
              {
                dateStyle: "medium",
              },
            ).format(item.updatedAt)}
          </p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
            <Link
              href={
                basePath +
                "/" +
                item.id
              }
              className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text hover:bg-muted"
            >
              Open workspace
            </Link>
            <ProjectArchiveControl
              projectId={item.id}
              projectTitle={item.title}
              status={item.status}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="m-0 font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
