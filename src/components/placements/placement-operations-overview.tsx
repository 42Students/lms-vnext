import { SummaryStrip } from "@/components/ui/summary-strip";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import Link from "next/link";
import { SuperAdminDriveQuickSearch } from "@/components/placements/super-admin-drive-quick-search";
import {SuperAdminNeedsAttention} from "@/components/placements/super-admin-needs-attention";
import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

type Operations = Awaited<ReturnType<typeof getPlacementTpoOperations>>;

function Metric({ label, value, description }: { label: string; value: number; description: string }) {
  return <StatTile className={tpoTileStyles.tile} label={label} value={value} detail={description} />;
}
function priorityTone(priority: string): "error" | "warning" | "info" {
  return priority === "HIGH" ? "error" : priority === "MEDIUM" ? "warning" : "info";
}
function formatWhen(value: Date, timezone: string | null) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: timezone ?? "Asia/Kolkata" }).format(value);
}
function conversion(value: number, previous: number) {
  if (previous <= 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / previous);
}
export function PlacementOperationsOverview({ operations, basePath, showDriveSearch = false, staleDays=7 }: { operations: Operations; basePath: string; showDriveSearch?: boolean; staleDays?: number }) {
  // Independent, college-wide aggregate counts: operations.jobs is only
  // the latest 60 published + 20 other sampled cards, NOT the directory.
  const activeSample=operations.jobs.filter(item=>item.job.status==="PUBLISHED");
  const affected=operations.attention.categories.reduce((sum,item)=>sum+item.affected,0);
  const attentionItems=operations.attention.categories.flatMap(item=>item.samples);
  return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
    {showDriveSearch ? <div className="grid min-w-0 grid-cols-1 overflow-hidden border-y border-border sm:grid-cols-4">
      <Metric label="Active drives" value={operations.summary.activeDrives} description="All non-archived, published drives in the college. Cards show only the latest 60." />
      <Metric label="Closed / draft" value={operations.summary.closedJobs+operations.summary.draftJobs} description="Closed and draft drives; cancelled drives are counted separately." />
      <Metric label="All drives" value={operations.summary.totalJobs} description="All non-archived college drives, not the bounded card sample." />
      {operations.attention.available?<Metric label="Needs attention" value={affected} description="Affected records in all four legacy attention categories; not a distinct-drive count." />:
        <p role="status" className="p-3 text-sm text-body">Couldn\u0027t check for anything that needs attention.</p>}
    </div> : null}
    <div className="grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Live jobs" value={operations.summary.publishedJobs} description="Published opportunities currently operated by the placement cell." />
      <Metric label="Applications" value={operations.summary.submittedApplications} description="Active submitted applications across current jobs." />
      <Metric label="Needs screening" value={operations.summary.pendingScreening} description="Candidates waiting for a placement-cell screening decision." />
      <Metric label="Needs attention" value={operations.summary.jobsNeedingAttention} description="Jobs with an unresolved operational action." />
    </div>
    {showDriveSearch?(
      operations.attention.available
        ? <SuperAdminNeedsAttention items={attentionItems} basePath={basePath}/>
        : <section role="status" className="border-b border-border py-4 text-sm text-body">
            Couldn\u0027t check for anything that needs attention.
            <Link href={basePath} className="ml-3 font-semibold text-link underline">Retry</Link>
          </section>
    ):
    <section className="border-b border-border pb-6">
      <div className="border-b border-border pb-3">
        <h2 className="m-0 text-base font-semibold text-foreground">Needs attention</h2>
        <p className="mt-1 text-sm text-body">Highest-impact placement work across jobs, ordered by urgency.</p>
        {showDriveSearch?<form action="/admin/placements" method="get" className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-[6px]">Stale after
            <Select name="staleDays" defaultValue={staleDays} className="min-w-0">
              {[3,7,14,30].map(n=><option key={n} value={n}>{n} days</option>)}
            </Select></label>
          <Button type="submit" variant="secondary">Apply</Button>
        </form>:null}
      </div>
      {operations.workQueue.length === 0 ? <div className="pt-4"><EmptyState title="No placement work is blocked" description="New screening, result, scheduling and draft actions will surface here automatically." action={<Link href={basePath+"/drives"} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text md:min-h-9">Drive lifecycle</Link>} /></div> :
        <div className="min-w-0 divide-y divide-border">{operations.workQueue.map((item, index) =>
          <div key={item.jobId + item.code + index} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={priorityTone(item.priority)}>{item.priority}</StatusBadge><span className="text-xs font-semibold text-muted-foreground">{item.count} {item.count === 1 ? "item" : "items"}</span></div>
              <p className="mt-2 font-semibold text-foreground">{item.jobTitle}</p>
              <p className="mt-1 text-sm text-body">{item.companyName} · {item.code.toLowerCase().split("_").join(" ")}</p>
            </div>
            <Link href={basePath + "/jobs/" + item.jobId + (item.code==="STALE_APPLICATIONS" || item.code==="INTERVIEW_UNSCHEDULED" ? "/applications" : "")} className="inline-flex min-h-11 md:min-h-9 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text">Review {item.code==="STALE_APPLICATIONS"?"stale applicants":"drive"}</Link>
          </div>)}</div>}
    </section>}
    {showDriveSearch?<section className="min-w-0 space-y-3" aria-label="Active placement drives">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold text-foreground">Active drives</h2>
          <p className="mt-1 text-sm text-body">Open opportunities and their outstanding placement work.</p>
        </div>
        <Link href={basePath+"/drives"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">View all drives</Link>
      </div>
      {activeSample.length>0?
        <div className="grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-2 xl:grid-cols-4">
          {activeSample.map(item=>{
            const needs=operations.workQueue.filter(action=>action.jobId===item.job.id);
            const work=attentionItems.filter(action=>action.jobId===item.job.id)
              .reduce((total,action)=>total+action.count,0);
            const deadline=item.job.applicationDeadline;
            const expired=Boolean(deadline&&deadline.getTime()<Date.now());
            const company=item.job.company.name;
            return <article key={item.job.id} className="group relative flex min-w-0 flex-col gap-3 rounded-[12px] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-space-4)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[var(--lms-primary)] hover:shadow-md focus-within:border-[var(--lms-primary)]">
              <div className="flex items-start justify-between gap-2">
                <span aria-label={company+" company monogram"} className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] text-base font-semibold text-[var(--lms-primary-text)]">
                  {company.trim().slice(0,2).toUpperCase()||"CO"}
                </span>
                <StatusBadge tone={work>0?"warning":"success"}>{work>0?work+" need attention":"Live"}</StatusBadge>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-semibold text-[var(--lms-heading)]">
                  <Link href={basePath+"/jobs/"+item.job.id} className="hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)]">{item.job.title}</Link>
                </h3>
                <p className="mt-1 break-words text-xs text-muted-foreground">{company}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-[var(--lms-canvas-border)] pt-3 text-xs">
                <div><p className="text-muted-foreground">Applicants</p><strong className="mt-1 block text-base text-foreground">{item.metrics.submittedApplications}</strong></div>
                <div><p className="text-muted-foreground">Rounds</p><strong className="mt-1 block text-base text-foreground">{item.metrics.roundCount}</strong></div>
              </div>
              <div className="text-xs text-body">
                <span aria-hidden="true" className="mr-1">◷</span>
                {deadline?<span className={expired?"text-[var(--lms-error)]":""}>
                  {expired?"Deadline passed: ":"Apply by "}
                  {formatWhen(deadline,"Asia/Kolkata")}
                </span>:<span>No application deadline</span>}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-[var(--lms-canvas-border)] pt-3 text-xs">
                <Link href={basePath+"/jobs/"+item.job.id+"/applications"} className="font-semibold text-link underline">Applications</Link>
                <span aria-hidden="true">·</span>
                <Link href={basePath+"/jobs/"+item.job.id+"/settings"} className="font-semibold text-link underline">Manage</Link>
                <details className="ml-auto min-w-[120px] text-left">
                  <summary className="cursor-pointer font-semibold text-link underline underline-offset-4">More actions</summary>
                  <div className="mt-2 space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
                    <SuperAdminDriveDuplicate jobId={item.job.id} title={item.job.title}/>
                    <SuperAdminDriveDeadline jobId={item.job.id} deadline={deadline?.toISOString()??null}/>
                  </div>
                </details>
              </div>
            </article>;
          })}
        </div>:
        <EmptyState title="No active drives yet" description="Published placement drives will appear here." action={<Link href={basePath+"/drives"} className="text-sm font-semibold text-link underline">Create your first drive</Link>}/>
      }
    </section>:null}
    <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
      <div className="border-b border-border pb-3">
        <h2 className="m-0 text-base font-semibold text-foreground">Placement funnel</h2>
        <p className="mt-1 text-sm text-body">{operations.analytics.season ? `${operations.analytics.season.name} · durable season-to-date conversion` : "Start a placement season to establish a durable funnel baseline."}</p>
      </div>
      <SummaryStrip className="my-4" label="Placement funnel" steps={[
        {label:"Applications",value:operations.analytics.funnel.applications,note:"Season total"},
        {label:"Shortlisted",value:operations.analytics.funnel.shortlisted,
          note:conversion(operations.analytics.funnel.shortlisted,operations.analytics.funnel.applications)+" from previous stage"},
        {label:"Offered",value:operations.analytics.funnel.offered,
          note:conversion(operations.analytics.funnel.offered,operations.analytics.funnel.shortlisted)+" from previous stage"},
        {label:"Accepted",value:operations.analytics.funnel.accepted,
          note:conversion(operations.analytics.funnel.accepted,operations.analytics.funnel.offered)+" from previous stage"},
        {label:"Joined",value:operations.analytics.funnel.joined,
          note:conversion(operations.analytics.funnel.joined,operations.analytics.funnel.accepted)+" from previous stage"},
      ]} />
    </section>
    <section className="border-b border-border pb-6">
      <div className="border-b border-border pb-3"><h2 className="m-0 text-base font-semibold text-foreground">Upcoming rounds</h2><p className="mt-1 text-sm text-body">Scheduled rounds across the active college.</p></div>
      {operations.upcomingRounds.length === 0 ? <p className="m-0 px-5 py-6 text-sm text-muted-foreground">No future rounds are scheduled.</p> :
        <div className="divide-y divide-border">{operations.upcomingRounds.map(round =>
          <div key={round.roundId} className="flex min-w-0 flex-col gap-[var(--lms-space-2)] py-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between">
            <div><p className="m-0 font-semibold text-foreground">{round.companyName} · {round.jobTitle}</p><p className="mt-1 text-sm text-body">{round.sequence}. {round.name} · {formatWhen(round.scheduledAt, round.timezone)}</p></div>
            <Link href={basePath + "/jobs/" + round.jobId} className="text-sm font-semibold text-primary-text hover:text-primary-hover">Open drive →</Link>
          </div>)}</div>}
    </section>
    {showDriveSearch ? <SuperAdminDriveQuickSearch basePath={basePath}
      jobs={operations.jobs.map(item=>({
        id:item.job.id,title:item.job.title,companyName:item.job.company.name,
        status:item.job.status,applicants:item.metrics.submittedApplications,
      }))} /> : null}
    <section className="border-b border-border pb-6">
      <div className="border-b border-border pb-3"><h2 className="m-0 text-base font-semibold text-foreground">Job portfolio</h2><p className="mt-1 text-sm text-body">Operational state for every non-archived placement job in this college.</p></div>
      <div className="divide-y divide-border">{operations.jobs.map(item =>
        <div key={item.job.id} className="flex min-w-0 flex-col gap-[var(--lms-space-3)] py-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><p className="m-0 font-semibold text-foreground">{item.job.title}</p><StatusBadge tone={item.job.status === "PUBLISHED" ? "success" : item.job.status === "DRAFT" ? "warning" : "neutral"}>{item.job.status}</StatusBadge></div><p className="mt-1 text-sm text-body">{item.job.company.name} · {item.metrics.submittedApplications} applications · {item.metrics.roundCount} rounds</p></div>
          <Link href={basePath + "/jobs/" + item.job.id} className="text-sm font-semibold text-primary-text hover:text-primary-hover">Open drive →</Link>
        </div>)}</div>
    </section>
  </div>;
}
