import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoDriveLifecycleList } from "@/modules/placements/tpo-drive-lifecycle-list-service";
type Search = { seasonId?: string | string[]; view?: string | string[];search?:string|string[];deadline?:string|string[];workMode?:string|string[];employmentType?:string|string[];page?:string|string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function TpoDriveLifecyclePage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const params = await searchParams;
  const data = await getTpoDriveLifecycleList(context, {
    ...(first(params.seasonId) ? { seasonId: first(params.seasonId) } : {}),
    ...(first(params.view) ? { view: first(params.view) } : {}),
    ...(first(params.search)?{search:first(params.search)}:{}),
    ...(first(params.deadline)?{deadline:first(params.deadline)}:{}),
    ...(first(params.workMode)?{workMode:first(params.workMode)}:{}),
    ...(first(params.employmentType)?{employmentType:first(params.employmentType)}:{}),
    ...(first(params.page)?{page:first(params.page)}:{}),
  });
  const metrics=[["Drafts",data.counts.drafts],["Live",data.counts.live],["Closed",data.counts.closed],
   ["Deadlines in 7 days",data.counts.deadlinesNextSevenDays]] as const;
  function pageHref(page:number){return {pathname:"/tpo/placements/lifecycle",query:{
   ...(data.season?{seasonId:data.season.id}:{}),view:data.view,search:data.search,deadline:data.deadline,workMode:data.workMode,employmentType:data.employmentType,page,
  }};}
  return <div className="space-y-6">
    <PageHeader eyebrow="TPO · Drives" title="Drive lifecycle"
      description="College-owned drafts, live opportunities and closed drives from persisted jobs." />
    <Link href="/tpo/placements" className="text-sm font-semibold text-primary-text hover:underline">← Placement operations</Link>
    <form action="/tpo/placements/lifecycle" method="get"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="min-w-40 flex-1 text-sm font-semibold text-body">Season
        <select name="seasonId" defaultValue={data.season?.id ?? ""} disabled={!data.seasons.length}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          {data.seasons.length === 0 ? <option value="">No season</option> : null}
          {data.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Lifecycle
        <select name="view" defaultValue={data.view}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All jobs</option><option value="DRAFT">Drafts</option>
          <option value="LIVE">Live</option><option value="CLOSED">Closed</option>
        </select>
      </label>
      <label className="min-w-40 flex-1 text-sm font-semibold text-body">Company or drive
       <input name="search" defaultValue={data.search} maxLength={100}
        className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Deadline state
        <select name="deadline" defaultValue={data.deadline} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All deadlines</option><option value="DUE_SOON">Live · next 7 days</option>
          <option value="OVERDUE">Live · passed</option><option value="UNSET">No recorded deadline</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Work mode
        <select name="workMode" defaultValue={data.workMode} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All modes</option><option value="ONSITE">On-site</option>
          <option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Employment type
        <select name="employmentType" defaultValue={data.employmentType} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All employment</option><option value="FULL_TIME">Full-time</option>
          <option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option>
        </select>
      </label>
      <button type="submit" className="min-h-11 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
    </form>
    {!data.season ? <EmptyState title="No season available" description="Create a season before reading its drive lifecycle." /> : <>
      <section aria-label="Drive lifecycle counts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(([name,n]) =>
          <div key={name} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-body">{name}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{n}</p>
          </div>)}
      </section>
      <p className="text-sm text-body">Requests are not included: this view counts persisted job lifecycle states only.
        A submitted request is not the same as a draft.</p>
      <p role="status" className="text-sm text-body">{data.totalMatching} matching drives · Page {data.page} of {data.totalPages}.
       Counts cover the selected season and search across every page.</p>
      {data.rows.length === 0 ?
        <EmptyState title="No matching drives" description="No non-archived jobs match the selected season and lifecycle." /> :
        <section className="grid gap-3" aria-label="Drives">
          {data.rows.map((job) => <article key={job.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h2 className="font-semibold text-foreground">{job.company} · {job.title}</h2>
                <p className="text-sm text-body">{job.status} · {job.employmentType} · {job.workMode}</p>
                <p className="text-xs text-body">Deadline: {job.applicationDeadline
                  ? new Date(job.applicationDeadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})
                  +" IST": "Not recorded"}</p></div>
              <Link href={"/tpo/placements/jobs/"+job.id} className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Open drive</Link>
            </div></article>)}
        </section>}
      <nav aria-label="Drive pages" className="flex flex-wrap items-center justify-between gap-3">
       {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Previous</Link>:<span/>}
       {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Next</Link>:null}
      </nav>
    </>}
  </div>;
}
