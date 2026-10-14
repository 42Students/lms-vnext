import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { filterRecruiterDrives, recruiterDriveListQuerySchema, recruiterDrivesHref, summarizeRecruiterDrives } from "@/modules/placements/recruiter-drive-list-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

type Params = { collegeId?: string | string[]; view?: string | string[]; q?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function HrDrivesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter) redirect("/dashboard");
  const raw = await searchParams;
  const query = recruiterDriveListQuerySchema.safeParse({
    collegeId: first(raw.collegeId) || undefined,
    view: first(raw.view) || undefined, q: first(raw.q) || undefined,
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
  const filtered = filterRecruiterDrives(jobs, {...query.data, collegeId: selectedCollege});
  return <div className="space-y-6">
    <PageHeader eyebrow="Employer Recruiter" title="Drives" description="Hiring drives for the selected college and your exact employer relationship. Published and closed drives only." />
    {grants.length > 1 ? <nav aria-label="College" className="flex flex-wrap gap-2">{grants.map(grant =>
      <Link key={grant.id} href={recruiterDrivesHref({...query.data, collegeId: grant.collegeId})}
        className={selectedCollege === grant.collegeId ? "rounded-full bg-primary px-3 py-2 text-sm text-on-primary" : "rounded-full border border-border px-3 py-2 text-sm text-body"}>{grant.collegeName}</Link>)}</nav> : null}
    <nav aria-label="Drive lifecycle" className="flex flex-wrap gap-2">{viewOptions.map(option =>
      <Link key={option.view} href={recruiterDrivesHref({...query.data, collegeId: selectedCollege, view: option.view})}
        aria-current={query.data.view === option.view ? "page" : undefined}
        className={query.data.view === option.view ? "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary" : "rounded-md border border-border px-4 py-2 text-sm text-body"}>
        {option.label} ({option.count})</Link>)}</nav>
    <form method="get" action="/hr/drives" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="collegeId" value={selectedCollege} />
      <input type="hidden" name="view" value={query.data.view} />
      <label className="grid min-w-52 flex-1 gap-1 text-sm text-body">Search role
        <input name="q" defaultValue={query.data.q} maxLength={100} placeholder="Job title" className="min-h-11 rounded-md border border-border bg-surface px-3" /></label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Search</button>
      <Link href={recruiterDrivesHref({view: "ALL", collegeId: selectedCollege, q: ""})} className="py-3 text-sm text-primary-text">Reset</Link>
    </form>
    {query.data.view === "WAITING" ? <EmptyState title="Requests not available here" description="Waiting requests and sent-back approvals are not yet backed by a recruiter-visible request-state read. Published jobs are never mislabeled as pending requests." /> :
     filtered.length ? <RecruiterPlacementPortfolio jobs={filtered} /> :
     <EmptyState title="No matching drives" description="No authorized, non-archived drives match this college, lifecycle and search." />}
    <p className="text-xs text-muted-foreground">Request a Drive, Hire Again, and Fix and Resend require the separate employer request lifecycle and remain unavailable here.</p>
  </div>;
}
