import { MetricBar } from "@/components/ui/metric-bar";
import styles from "./project-workspace-readiness.module.css";
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
  templateId?:string|null;
  courseLabel?:string|null;phase?:string|null;dueLabel?:string|null;
  memberCount: number;
  progressPercent: number;
  riskReasons?: readonly string[];
};

/** Do not announce impossible backend progress as a valid ARIA percentage. */
export function safeProjectProgressPercent(value: number): number | null {
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

function tone(status:string,riskReasons:readonly string[]=[]){
  const normalized=status.trim().toUpperCase();
  if(normalized==="BLOCKED"||normalized==="FAILED"||
    (normalized==="ACTIVE"&&riskReasons.includes("Active blocker")))return "error" as const;
  if(["COMPLETED","READY","EVALUATED"].includes(normalized))return "success" as const;
  if(["ACTIVE","IN_PROGRESS","IN_REVIEW"].includes(normalized))return "info" as const;
  if(["REVIEW","PENDING"].includes(normalized))return "warning" as const;
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

function TemplateLink({item,basePath}:{item:ProjectAdminWorkspaceListItem;basePath:string}){
  if(item.templateId)return <span className="text-xs text-body">Template: {item.templateTitle?.trim()||"Assigned template"}</span>;
  return <Link href={basePath+"/"+encodeURIComponent(item.id)+"/summary?from=workspaces&openTemplate=1"}
    aria-label={"No template for "+(item.title?.trim()||"workspace")+" — attach one"}
    className="inline-flex min-h-11 items-center text-xs font-semibold text-warning-text underline md:min-h-9">
    No template — attach one
  </Link>;
}
function workspaceTitle(item:ProjectAdminWorkspaceListItem){
  return item.title?.trim()||"Workspace";
}
function workspaceSummaryHref(item:ProjectAdminWorkspaceListItem,basePath:string){
  return basePath+"/"+encodeURIComponent(item.id)+"/summary?from=workspaces";
}
function WorkspaceActions({item,basePath}:{item:ProjectAdminWorkspaceListItem;basePath:string}){
 const root=basePath+"/"+encodeURIComponent(item.id);
 return <div className="flex flex-wrap items-center gap-2">
  <Link href={workspaceSummaryHref(item,basePath)}
    className="inline-flex min-h-11 items-center gap-1 text-link underline md:min-h-9"
    aria-label={"Open summary for "+workspaceTitle(item)}>
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 9c2.5-3.5 4.8-5 7-5s4.5 1.5 7 5c-2.5 3.5-4.8 5-7 5S4.5 12.5 2 9Z"/>
      <circle cx="9" cy="9" r="2.3"/>
    </svg>Open
  </Link>
  <Link href={root+"/team"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Assign Mentor</Link>
  <Link href={root+"/team?editLearners=1"} title="Review the existing roster before replacing learners"
    className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Assign Learners</Link>
  <ProjectArchiveControl projectId={item.id} projectTitle={workspaceTitle(item)}
    status={item.status} expectedUpdatedAt={item.updatedAt.toISOString()}/>
 </div>;
}
export function ProjectAdminWorkspaceList({
  items,
  basePath,
  emptyTitle,
  emptyDescription,
  view="table",
  compactAdmin = false,
}: {
  items: readonly ProjectAdminWorkspaceListItem[];
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
  view?:"cards"|"table";
  compactAdmin?: boolean;
}) {
  if (!items.length) {
    return (
      <EmptyState
        title={emptyTitle==="No Projects match these filters"?"No projects yet":emptyTitle}
        description={emptyDescription}
        action={<div className="flex flex-wrap gap-3">
          <Link href={basePath+"/create"}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
            Create project
          </Link>
          <Link href={basePath}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
            Clear filters
          </Link>
        </div>}
      />
    );
  }

  if(view==="table")return <DataTable
    caption="Project workspace table" mobileMode="scroll"
    className="min-w-0 [&_table]:min-w-[1100px]"
    rows={items}
    getRowKey={item=>item.id}
    columns={[
      {key:"workspace",header:"Workspace",mobilePriority:"primary",cell:item=><>
        <Link href={workspaceSummaryHref(item,basePath)}
          className="block break-words font-semibold text-link hover:underline">{workspaceTitle(item)}</Link>
        <span className="block break-all text-xs text-muted-foreground">{item.id}</span>
        <TemplateLink item={item} basePath={basePath}/>
      </>},
      {key:"course",header:"Course",mobilePriority:"secondary",cell:item=>item.courseLabel??"—"},
      {key:"mentor",header:"Mentor",mobilePriority:"secondary",cell:item=>item.mentorName?.trim()||"—"},
      {key:"phase",header:"Phase",mobilePriority:"secondary",cell:item=>item.phase??"—"},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
        <StatusBadge tone={tone(item.status,item.riskReasons)}>{collegeWorkspaceStatusLabel(item.status,item.riskReasons)}</StatusBadge>},
      {key:"progress",header:"Progress",mobilePriority:"secondary",cell:item=>{
        const progress=safeProjectProgressPercent(item.progressPercent);
        return progress===null ? <span className="text-sm text-muted-foreground">Progress unavailable</span> :
        <div className={styles.inlineCell}>
          <MetricBar role="progressbar" className={styles.inlineTrack}
            label={item.title+" progress"} value={progress} maximum={100} unit="percent" />
          <span className={styles.inlinePercent}>{progress}%</span>
        </div>;
      }},
      {key:"due",header:"Due",mobilePriority:"secondary",cell:item=>item.dueLabel??"—"},
      {key:"members",header:"Members",mobilePriority:"secondary",cell:item=>item.memberCount},
      {key:"action",header:"Actions",mobilePriority:"action",
        cell:item=><WorkspaceActions item={item} basePath={basePath}/>},
    ]}
    empty={<EmptyState title={emptyTitle} description={emptyDescription}/>}
  />;
  if (compactAdmin) return <div className="min-w-0 divide-y divide-border border-y border-border">
    {items.map(item=><article key={item.id} className="min-w-0 py-4">
      <div className="grid min-w-0 gap-3 min-[768px]:grid-cols-[minmax(0,1fr)_auto] min-[768px]:items-center min-[768px]:gap-5">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <Link href={workspaceSummaryHref(item,basePath)} className="inline-flex min-h-11 max-w-full items-center break-words text-base font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">{workspaceTitle(item)}</Link>
            <StatusBadge tone={tone(item.status)}>{collegeWorkspaceStatusLabel(item.status,item.riskReasons)}</StatusBadge>
          </div>
          <p className="mt-1 break-words text-sm text-body leading-[22px]">{item.summary ?? "Project workspace."}</p>
          <div className="mt-2"><TemplateLink item={item} basePath={basePath}/></div>
          <dl className="mt-2 grid min-w-0 gap-x-4 gap-y-2 text-xs md:grid-cols-3">
            <div className="min-w-0"><dt className="font-semibold text-muted-foreground">Mentor</dt><dd className="break-words text-foreground">{item.mentorName??"Unassigned"}</dd></div>
            <div className="min-w-0"><dt className="font-semibold text-muted-foreground">Members</dt><dd className="text-foreground">{item.memberCount}</dd></div>
            <div className="min-w-0"><dt className="font-semibold text-muted-foreground">Progress</dt><dd className="text-foreground">{safeProjectProgressPercent(item.progressPercent)===null?"Unavailable":safeProjectProgressPercent(item.progressPercent)+"%"}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground leading-[20px]">Updated {formatProjectAdminUpdatedDateIst(item.updatedAt)}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 min-[768px]:justify-end">
          <WorkspaceActions item={item} basePath={basePath}/>
        </div>
      </div>
    </article>)}
  </div>;
  return (
    <div className="grid min-w-0 gap-4 min-[992px]:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex min-w-0 flex-col rounded-[8px] border border-border bg-surface p-4 md:p-5"
        >
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text leading-[20px]">
                {item.courseLabel??"Project workspace"}
              </p>
              <div className="mt-2"><TemplateLink item={item} basePath={basePath}/></div>
              <h2 className="mt-2 line-clamp-2 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
                <Link href={workspaceSummaryHref(item,basePath)}
                  className="inline-flex min-h-11 items-center break-words rounded-sm underline-offset-4 hover:text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                  {workspaceTitle(item)}
                </Link>
              </h2>
            </div>
            <StatusBadge
              tone={tone(item.status)}
            >
              {collegeWorkspaceStatusLabel(item.status,item.riskReasons)}
            </StatusBadge>
          </div>

          <p className="mt-2 text-xs text-body">{item.phase??"Planning"} · {item.dueLabel??"Due not set"}</p>
          <p className="mt-3 line-clamp-2 text-sm text-body leading-[22px]">
            {item.summary ??
              "Project workspace."}
          </p>

          <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 border-y border-border py-3 text-xs md:grid-cols-3 [&>*]:min-w-0 [&>*]:py-1">
            <Metric
              label="Mentor"
              value={
                item.mentorName?.trim() ||
                "—"
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

          <p className="mb-0 mt-3 text-xs text-muted-foreground leading-[20px]">
            Updated{" "}
            {formatProjectAdminUpdatedDateIst(item.updatedAt)}
          </p>

          <div className="mt-auto flex min-w-0 items-center justify-end pt-4">
            <WorkspaceActions item={item} basePath={basePath}/>
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
      <p className="mt-1 truncate font-semibold text-foreground min-w-0">
        {value}
      </p>
    </div>
  );
}
