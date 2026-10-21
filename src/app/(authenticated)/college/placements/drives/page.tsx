import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { driveListHref, driveQueryFromSearch } from "@/modules/placements/college-drive-read-model";
import { listCollegeDrives } from "@/modules/placements/college-drive-read-service";
import {CollegeDriveBulkActions} from "@/components/placements/college-drive-bulk-actions";
import {CollegeDriveDeadlineAction} from "@/components/placements/college-drive-deadline-action";
import {CollegeDriveRowLifecycleAction} from "@/components/placements/college-drive-row-lifecycle-action";
import {CollegeDriveArchiveAction} from "@/components/placements/college-drive-archive-action";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {AuthorizationError} from "@/modules/permissions/policy";

export default async function CollegeDrivesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Jobs"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator to assign a college before managing placement jobs."
      action={<Link href="/dashboard"
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>} />
  </div>;
  const params = await searchParams;
  const query = driveQueryFromSearch({
    ...params,
    status:params.status ?? "ALL",
  });
  if (!query) return <div className="space-y-4">
    <PageHeader title="Drives" />
    <ErrorState title="Invalid drive filters" description="Search, status, season, company or page is invalid."
      action={<Link href="/college/placements/drives" className="inline-flex min-h-11 md:min-h-9 items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>} />
  </div>;
  let data: Awaited<ReturnType<typeof listCollegeDrives>>;
  try {
    data = await listCollegeDrives(context,query);
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Jobs"/>
      <ErrorState title="Failed to load jobs. Please try again."
        description="The drive list could not be loaded. No changes were made."
        action={<Link href={driveListHref(query)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Try Again</Link>}/>
    </div>;
  }
  const formatter = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"drive",header:"Drive",mobilePriority:"primary",cell:item=><div className="min-w-0">
      <p className="break-words font-semibold">{item.title}</p>
      <Link href={`/college/placements/jobs/${item.id}/overview`}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Open drive</Link>
    </div>},
    {key:"company",header:"Company",cell:item=>item.companyName},
    {key:"type",header:"Type",cell:item=>
      <StatusBadge tone="neutral">{item.type.replaceAll("_"," ")}</StatusBadge>},
    {key:"location",header:"Location",cell:item=>item.locations.join(", ")||"Not specified"},
    {key:"deadline",header:"Deadline",cell:item=>item.applicationDeadline?formatter.format(item.applicationDeadline):"Not specified"},
    {key:"posted",header:"Posted",cell:item=>item.publishedAt?formatter.format(item.publishedAt):"Not posted"},
    {key:"applicants",header:"Applicants",cell:item=>item.applicants},
    {key:"status",header:"Status",cell:item=><StatusBadge
      tone={item.status==="PUBLISHED"?"success":item.status==="DRAFT"?"neutral":"warning"}>
      {item.status==="PUBLISHED"?"Active":item.status==="DRAFT"?"Draft":item.status==="CLOSED"?"Closed":item.status==="ARCHIVED"?"Archived":item.status}
    </StatusBadge>},
    {key:"actions",header:"Actions",mobilePriority:"action",cell:item=><div className="flex min-w-0 flex-wrap items-center gap-2">
      <Link href={`/college/placements/jobs/${item.id}/applications`}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View applications</Link>
      <Link href={`/college/placements/jobs/${item.id}/settings`}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Edit Job</Link>
      <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
      {item.status!=="ARCHIVED"?<details className="min-w-0 w-full">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-error)] md:min-h-9">
          Delete / archive drive
        </summary>
        <div className="mt-2 max-w-md">
          <CollegeDriveArchiveAction jobId={item.id}/>
        </div>
      </details>:null}
      {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id}
        title={item.title} currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
    </div>},
  ];

  return <div className="space-y-6">
    <PageHeader title="Jobs"
      description="College-owned placement drives. This list is independent of cross-college recruiter access."
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link href="/college/placements/new"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-on-primary md:min-h-9 hover:bg-[var(--lms-button-primary-hover)]">
          + Create Job
        </Link>
        <Link href="/college/placements"
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
          Operations workspace
        </Link>
      </div>} />
    <form method="get" role="search" aria-label="Drive filters" className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 min-w-0 gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] max-[767px]:grid-cols-1">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title or company
        <Input type="search" name="q" defaultValue={query.q} maxLength={100}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={query.status}>
          {["ALL","DRAFT","PUBLISHED","CLOSED","ARCHIVED"].map(s=><option key={s} value={s}>{s==="PUBLISHED"?"Active":s==="DRAFT"?"Draft":s==="CLOSED"?"Closed":s==="ARCHIVED"?"Archived":"All"}</option>)}
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Season
        <Select name="seasonId" defaultValue={query.seasonId ?? ""}>
          <option value="">All seasons</option>
          {data.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company
        <Select name="relationshipId" defaultValue={query.relationshipId ?? ""}
         >
          <option value="">All companies</option>
          {data.companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </label>
      <details className="min-w-0 border-t border-border pt-2 md:col-span-2 lg:col-span-4 xl:col-span-6"
        open={Boolean(query.deadlineAfter||query.deadlineBefore||query.minimumApplicants||query.sort!=="TITLE")||undefined}>
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Advanced filters</summary>
        <div className="grid min-w-0 gap-[var(--lms-space-3)] pt-3 md:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline from
        <DateInput mode="date" name="deadlineAfter" defaultValue={query.deadlineAfter??""}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline on or before
        <DateInput mode="date" name="deadlineBefore" defaultValue={query.deadlineBefore??""}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">At least N applicants
        <Input type="number" name="minimumApplicants" min={0} max={100000}
          defaultValue={query.minimumApplicants??""}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
        <Select name="sort" defaultValue={query.sort}>
          <option value="TITLE">Title A–Z</option><option value="DEADLINE">Deadline first</option>
          <option value="NEWEST">Newest created</option><option value="APPLICANTS">Most applicants</option>
        </Select>
      </label>
        </div>
      </details>
      <Button type="submit" className="w-full self-end min-[768px]:w-auto">Filter</Button>
      <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-link underline md:min-h-9">Clear filters</Link>
    </form>
    <CollegeDriveBulkActions key={JSON.stringify(query)} drives={data.items}/>
    <section className="space-y-2" aria-label="Persisted drives">
      <p role="status" className="text-sm text-body leading-[1.6]">{data.total.toLocaleString("en-IN")} matching persisted drives</p>
      <DataTable caption="College placement jobs" columns={columns} rows={data.items}
        getRowKey={item=>item.id}
        empty={<div className="min-w-0 space-y-2 text-sm text-body" role="status">
          <p>{data.total===0 && query.status==="ALL" && !query.q && !query.seasonId && !query.relationshipId
            ?"No drives yet":data.total===0?"No drives match these filters in this college.":"No rows on this page. Choose an earlier page."}</p>
          {data.total===0 && query.status==="ALL" && !query.q &&
            !query.seasonId && !query.relationshipId?
            <p>Create first drive for this college when you&apos;re ready. Drive creation must be enabled in the placement operations workspace.</p>:null}
          <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>
        </div>} />
    </section>
    <nav aria-label="Drive pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
      <span>Page {data.query.page} of {data.totalPages}</span><div className="flex flex-wrap gap-3">
        {query.page>1?<Link className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveListHref({...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveListHref({...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
  </div>;
}
