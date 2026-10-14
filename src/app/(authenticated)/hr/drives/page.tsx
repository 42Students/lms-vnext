import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { filterRecruiterDrives, recruiterDriveListQuerySchema, recruiterDrivesHref, summarizeRecruiterDrives, paginateRecruiterDrives, sortRecruiterDrives } from "@/modules/placements/recruiter-drive-list-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";

type Params = { collegeId?: string | string[]; view?: string | string[]; q?: string | string[];
 employment?:string|string[]; mode?:string|string[]; deadline?:string|string[]; page?:string|string[];sort?:string|string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function HrDrivesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter) redirect("/dashboard");
  const raw = await searchParams;
  const query = recruiterDriveListQuerySchema.safeParse({
    collegeId: first(raw.collegeId) || undefined,
    view: first(raw.view) || undefined, q: first(raw.q) || undefined,
    employment:first(raw.employment)||undefined,mode:first(raw.mode)||undefined,
    deadline:first(raw.deadline)||undefined,page:first(raw.page)||undefined,
    sort:first(raw.sort)||undefined,
  });
  if (!query.success) return <div className="space-y-5"><PageHeader eyebrow="Recruiter" title="Drives" />
    <ErrorState title="Invalid drive filters" description="Review the college, lifecycle and search text."
      action={<Link href="/hr/drives" className="text-primary-text underline">Clear filters</Link>} /></div>;
  const grants = context.recruiter.grants;
  if (query.data.collegeId && !grants.some(grant => grant.collegeId === query.data.collegeId)) notFound();
  const selectedCollege = query.data.collegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  if (!selectedCollege) return <div className="space-y-5"><PageHeader eyebrow="Recruiter" title="Drives" description="Choose an authorized college to open its hiring drives." />
    {grants.length === 0 ? <EmptyState title="No active college access" description="Your placement-cell relationship must be active before any drives are visible." /> :
    <section className="grid gap-3 sm:grid-cols-2">{grants.map(grant => <Link key={grant.id} href={recruiterDrivesHref({...query.data, collegeId: grant.collegeId})}
      className="rounded-xl border border-border bg-surface p-5 hover:border-primary">{grant.collegeName}</Link>)}</section>}</div>;
  const jobs = (await listOwnRecruiterPlacementJobs(context)).filter(row => row.collegeId === selectedCollege);
  const totals = summarizeRecruiterDrives(jobs);
  const viewOptions = [
    {view: "ALL", label: "All", count: totals.all},
    {view: "LIVE", label: "Live", count: totals.live},
    {view: "CLOSED", label: "Closed", count: totals.closed},
    {view: "WAITING", label: "Waiting", count: totals.waiting},
  ] as const;
  // eslint-disable-next-line react-hooks/purity -- recruiter deadline urgency needs request-time current instant.
  const now = new Date();
  const filtered = filterRecruiterDrives(jobs, {...query.data, collegeId: selectedCollege},now);
  const pageResult = paginateRecruiterDrives(sortRecruiterDrives(filtered,query.data.sort),query.data.page);
  return <div className="space-y-6">
    <PageHeader eyebrow="Employer Recruiter" title="Drives"
      description="Hiring drives for the selected college and your exact employer relationship. Published and closed drives only."
      actions={<Link href={recruiterDriveDraftHref({collegeId:selectedCollege})}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Request a Drive · preview
      </Link>} />
    {grants.length > 1 ? <nav aria-label="College" className="flex flex-wrap gap-2">{grants.map(grant =>
      <Link key={grant.id} href={recruiterDrivesHref({...query.data, collegeId: grant.collegeId})}
        className={selectedCollege === grant.collegeId ? "rounded-full bg-primary px-3 py-2 text-sm text-on-primary" : "rounded-full border border-border px-3 py-2 text-sm text-body"}>{grant.collegeName}</Link>)}</nav> : null}
    <nav aria-label="Drive lifecycle" className="flex flex-wrap gap-2">{viewOptions.map(option =>
      <Link key={option.view} href={recruiterDrivesHref({...query.data, collegeId: selectedCollege, view: option.view, page: 1})}
        aria-current={query.data.view === option.view ? "page" : undefined}
        className={query.data.view === option.view ? "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary" : "rounded-md border border-border px-4 py-2 text-sm text-body"}>
        {option.label} ({option.count})</Link>)}</nav>
    {query.data.view!=="WAITING"?<div className="flex justify-end">
      <Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:1})
        .replace("/hr/drives","/api/placements/recruiter/drives/export")}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">
        Export matching drives CSV
      </Link>
    </div>:null}
    <form method="get" action="/hr/drives" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="collegeId" value={selectedCollege} />
      <input type="hidden" name="view" value={query.data.view} />
      <input type="hidden" name="page" value="1" />
      <label className="grid min-w-52 flex-1 gap-1 text-sm text-body">Search role
        <input name="q" defaultValue={query.data.q} maxLength={100} placeholder="Job title" className="min-h-11 rounded-md border border-border bg-surface px-3" /></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Employment
        <select name="employment" defaultValue={query.data.employment} className="min-h-11 rounded-md border border-border bg-surface px-3">
          <option value="ALL">All</option><option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option>
        </select></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Work mode
        <select name="mode" defaultValue={query.data.mode} className="min-h-11 rounded-md border border-border bg-surface px-3">
          <option value="ALL">All</option><option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
        </select></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Deadline
        <select name="deadline" defaultValue={query.data.deadline} className="min-h-11 rounded-md border border-border bg-surface px-3">
          <option value="ALL">Any</option><option value="TODAY">Today (IST)</option><option value="SOON">Within 7 days</option><option value="PAST">Recorded deadline passed</option><option value="UNKNOWN">Not recorded</option>
        </select></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Sort
        <select name="sort" defaultValue={query.data.sort} className="min-h-11 rounded-md border border-border bg-surface px-3">
          <option value="RECENT">Newest first</option>
          <option value="DEADLINE">Deadline first</option>
          <option value="TITLE">Title A–Z</option>
        </select>
      </label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Search</button>
      <Link href={recruiterDrivesHref({view: "ALL", collegeId: selectedCollege, q: "",employment:"ALL",mode:"ALL",deadline:"ALL",page:1,sort:"RECENT"})} className="py-3 text-sm text-primary-text">Reset</Link>
    </form>
    {query.data.view === "WAITING" ? <EmptyState title="Requests not available here" description="Waiting requests and sent-back approvals are not yet backed by a recruiter-visible request-state read. Published jobs are never mislabeled as pending requests." /> :
     pageResult.rows.length ? <RecruiterPlacementPortfolio jobs={pageResult.rows} /> :
     <EmptyState title="No matching drives" description="No authorized, non-archived drives match this college, lifecycle and search." />}
    {query.data.view !== "WAITING" ? <nav aria-label="Drive pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-body">{pageResult.total===0?"No matching drives":
        "Showing "+(Math.min(pageResult.total,(query.data.page-1)*pageResult.pageSize+1))+"–"+
        Math.min(pageResult.total,query.data.page*pageResult.pageSize)+" of "+pageResult.total}</p>
      <div className="flex gap-2">
        {query.data.page>1?<Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:query.data.page-1})}
          className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Previous</Link>:null}
        {query.data.page<pageResult.pages?<Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:query.data.page+1})}
          className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Next</Link>:null}
      </div></nav>:null}
    <Link href="/hr/round-results" className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text hover:border-primary">Review round results →</Link>
    <p className="text-xs text-muted-foreground">Draft previews are local-only. Approval submission, Fix and Resend and external sending remain unavailable until the registered employer-request workflow is ready.</p>
  </div>;
}
