import Link from "next/link";
import { SuperAdminDriveQuickSearch } from "@/components/placements/super-admin-drive-quick-search";
import {SuperAdminNeedsAttention} from "@/components/placements/super-admin-needs-attention";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

type Operations = Awaited<ReturnType<typeof getPlacementTpoOperations>>;

function Metric({ label, value, description }: { label: string; value: number; description: string }) {
  return <section className="rounded-xl border border-border bg-surface p-4">
    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    <p className="mt-1 text-xs leading-5 text-body">{description}</p>
  </section>;
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
function FunnelMetric({
  label,
  value,
  previous,
}: {
  label: string;
  value: number;
  previous?: number;
}) {
  return <div className="min-w-0">
    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    <p className="mt-1 text-xs text-body">{previous === undefined ? "Season total" : `${conversion(value, previous)} from previous stage`}</p>
  </div>;
}
export function PlacementOperationsOverview({ operations, basePath, showDriveSearch = false, staleDays=7 }: { operations: Operations; basePath: string; showDriveSearch?: boolean; staleDays?: number }) {
  return <div className="space-y-6">
    {showDriveSearch ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Active drives" value={operations.jobs.filter(r=>r.job.status==="PUBLISHED").length} description="Currently published opportunities." />
      <Metric label="Closed / draft" value={operations.jobs.filter(r=>["CLOSED","DRAFT"].includes(r.job.status)).length} description="Closed and draft opportunities." />
      <Metric label="All drives" value={operations.jobs.length} description="Non-archived drives in this college." />
      <Metric label="Needs attention" value={operations.summary.jobsNeedingAttention} description="Drives with outstanding operations." />
    </div> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Live jobs" value={operations.summary.publishedJobs} description="Published opportunities currently operated by the placement cell." />
      <Metric label="Applications" value={operations.summary.submittedApplications} description="Active submitted applications across current jobs." />
      <Metric label="Needs screening" value={operations.summary.pendingScreening} description="Candidates waiting for a placement-cell screening decision." />
      <Metric label="Needs attention" value={operations.summary.jobsNeedingAttention} description="Jobs with an unresolved operational action." />
    </div>
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="m-0 text-base font-semibold text-foreground">Placement funnel</h2>
        <p className="mt-1 text-sm text-body">{operations.analytics.season ? `${operations.analytics.season.name} · durable season-to-date conversion` : "Start a placement season to establish a durable funnel baseline."}</p>
      </div>
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5">
        <FunnelMetric label="Applications" value={operations.analytics.funnel.applications} />
        <FunnelMetric label="Shortlisted" value={operations.analytics.funnel.shortlisted} previous={operations.analytics.funnel.applications} />
        <FunnelMetric label="Offered" value={operations.analytics.funnel.offered} previous={operations.analytics.funnel.shortlisted} />
        <FunnelMetric label="Accepted" value={operations.analytics.funnel.accepted} previous={operations.analytics.funnel.offered} />
        <FunnelMetric label="Joined" value={operations.analytics.funnel.joined} previous={operations.analytics.funnel.accepted} />
      </div>
    </section>
    {showDriveSearch?<SuperAdminNeedsAttention items={operations.workQueue} basePath={basePath}/>:
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="m-0 text-base font-semibold text-foreground">Needs attention</h2>
        <p className="mt-1 text-sm text-body">Highest-impact placement work across jobs, ordered by urgency.</p>
        {showDriveSearch?<form action="/admin/placements" method="get" className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">Stale after
            <select name="staleDays" defaultValue={staleDays} className="min-h-10 rounded border border-border bg-surface px-3">
              {[3,7,14,30].map(n=><option key={n} value={n}>{n} days</option>)}
            </select></label>
          <button type="submit" className="min-h-10 rounded border border-border px-4 font-semibold">Apply</button>
        </form>:null}
      </div>
      {operations.workQueue.length === 0 ? <div className="p-5"><EmptyState title="No placement work is blocked" description="New screening, result, scheduling and draft actions will surface here automatically." /></div> :
        <div className="divide-y divide-border">{operations.workQueue.map((item, index) =>
          <div key={item.jobId + item.code + index} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={priorityTone(item.priority)}>{item.priority}</StatusBadge><span className="text-xs font-semibold text-muted-foreground">{item.count} {item.count === 1 ? "item" : "items"}</span></div>
              <p className="mt-2 font-semibold text-foreground">{item.jobTitle}</p>
              <p className="mt-1 text-sm text-body">{item.companyName} · {item.code.toLowerCase().split("_").join(" ")}</p>
            </div>
            <Link href={basePath + "/jobs/" + item.jobId + (item.code==="STALE_APPLICATIONS" || item.code==="INTERVIEW_UNSCHEDULED" ? "/applications" : "")} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text">Review {item.code==="STALE_APPLICATIONS"?"stale applicants":"drive"}</Link>
          </div>)}</div>}
    </section>}
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4"><h2 className="m-0 text-base font-semibold text-foreground">Upcoming rounds</h2><p className="mt-1 text-sm text-body">Scheduled rounds across the active college.</p></div>
      {operations.upcomingRounds.length === 0 ? <p className="m-0 px-5 py-6 text-sm text-muted-foreground">No future rounds are scheduled.</p> :
        <div className="divide-y divide-border">{operations.upcomingRounds.map(round =>
          <div key={round.roundId} className="flex flex-col gap-2 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="m-0 font-semibold text-foreground">{round.companyName} · {round.jobTitle}</p><p className="mt-1 text-sm text-body">{round.sequence}. {round.name} · {formatWhen(round.scheduledAt, round.timezone)}</p></div>
            <Link href={basePath + "/jobs/" + round.jobId} className="text-sm font-semibold text-primary-text hover:text-primary-hover">Open drive →</Link>
          </div>)}</div>}
    </section>
    {showDriveSearch ? <SuperAdminDriveQuickSearch basePath={basePath}
      jobs={operations.jobs.map(item=>({
        id:item.job.id,title:item.job.title,companyName:item.job.company.name,
        status:item.job.status,applicants:item.metrics.submittedApplications,
      }))} /> : null}
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4"><h2 className="m-0 text-base font-semibold text-foreground">Job portfolio</h2><p className="mt-1 text-sm text-body">Operational state for every non-archived placement job in this college.</p></div>
      <div className="divide-y divide-border">{operations.jobs.map(item =>
        <div key={item.job.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><p className="m-0 font-semibold text-foreground">{item.job.title}</p><StatusBadge tone={item.job.status === "PUBLISHED" ? "success" : item.job.status === "DRAFT" ? "warning" : "neutral"}>{item.job.status}</StatusBadge></div><p className="mt-1 text-sm text-body">{item.job.company.name} · {item.metrics.submittedApplications} applications · {item.metrics.roundCount} rounds</p></div>
          <Link href={basePath + "/jobs/" + item.job.id} className="text-sm font-semibold text-primary-text hover:text-primary-hover">Open drive →</Link>
        </div>)}</div>
    </section>
  </div>;
}
