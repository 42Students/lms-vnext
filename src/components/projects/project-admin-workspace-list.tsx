import { MetricBar } from "@/components/ui/metric-bar";
import Link from "next/link";
import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import {collegeWorkspaceStatusLabel} from "@/modules/projects/college-workspace-status-label";
import {formatProjectAdminUpdatedDateIst} from "@/modules/projects/project-admin-date-model";

export type ProjectAdminWorkspaceListItem = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  updatedAt: Date;
  mentorName: string | null;
  templateTitle?: string | null;
  memberCount: number;
  progressPercent: number;
  riskReasons?: readonly string[];
};

/** Do not announce impossible backend progress as a valid ARIA percentage. */
export function safeProjectProgressPercent(value: number): number | null {
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

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
  view="cards",
}: {
  items: readonly ProjectAdminWorkspaceListItem[];
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
  view?:"cards"|"table";
}) {
  if (!items.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  if(view==="table")return <DataTable
    caption="Project workspace table"
    rows={items}
    getRowKey={item=>item.id}
    columns={[
      {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:item=><>
        <span className="font-semibold">{item.title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{item.templateTitle??"No template — attach one"}</span>
      </>},
      {key:"mentor",header:"Mentor",mobilePriority:"secondary",cell:item=>item.mentorName??"Unassigned"},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
        <StatusBadge tone={tone(item.status)}>{collegeWorkspaceStatusLabel(item.status,item.riskReasons)}</StatusBadge>},
      {key:"progress",header:"Progress",mobilePriority:"secondary",cell:item=>{
        const progress=safeProjectProgressPercent(item.progressPercent);
        return progress===null ? <span className="text-sm text-muted-foreground">Progress unavailable</span> :
        <div className="flex items-center gap-2">
          <MetricBar role="progressbar" className="w-24"
            label={item.title+" progress"} value={progress} maximum={100} unit="percent" />
          <span className="tabular-nums">{progress}%</span>
        </div>;
      }},
      {key:"members",header:"Members",mobilePriority:"secondary",cell:item=>item.memberCount},
      {key:"action",header:"Action",mobilePriority:"action",cell:item=>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={basePath+"/"+item.id} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open</Link>
          <ProjectArchiveControl projectId={item.id} projectTitle={item.title}
            status={item.status} expectedUpdatedAt={item.updatedAt.toISOString()}/>
        </div>},
    ]}
    empty={<EmptyState title={emptyTitle} description={emptyDescription}/>}
  />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex min-h-60 flex-col rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                {item.templateTitle ? "Template: " + item.templateTitle : "No template — attach one"}
              </p>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
                {item.title}
              </h2>
            </div>
            <StatusBadge
              tone={tone(item.status)}
            >
              {collegeWorkspaceStatusLabel(item.status,item.riskReasons)}
            </StatusBadge>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-body">
            {item.summary ??
              "Project workspace."}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-[var(--lms-control-radius,9px)] bg-muted p-3 text-xs">
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
                safeProjectProgressPercent(item.progressPercent)===null
                  ? "Unavailable"
                  : safeProjectProgressPercent(item.progressPercent) + "%"
              }
            />
          </div>

          <p className="mb-0 mt-3 text-xs text-muted-foreground">
            Updated{" "}
            {formatProjectAdminUpdatedDateIst(item.updatedAt)}
          </p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
            <Link
              href={
                basePath +
                "/" +
                item.id
              }
              className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-muted"
            >
              Open workspace
            </Link>
            <ProjectArchiveControl
              projectId={item.id}
              projectTitle={item.title}
              status={item.status}
              expectedUpdatedAt={item.updatedAt.toISOString()}
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
