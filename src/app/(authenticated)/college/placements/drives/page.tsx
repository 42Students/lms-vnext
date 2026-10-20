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
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function CollegeDrivesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const query = driveQueryFromSearch(await searchParams);
  if (!query) return <div className="space-y-4">
    <PageHeader title="Drives" />
    <ErrorState title="Invalid drive filters" description="Search, status, season, company or page is invalid."
      action={<Link href="/college/placements/drives" className="hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>} />
  </div>;
  const data = await listCollegeDrives(context, query);
  const formatter = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"drive",header:"Drive",mobilePriority:"primary",cell:item=><div className="min-w-0">
      <p className="break-words font-semibold">{item.title}</p>
      <Link href={`/college/placements/jobs/${item.id}/overview`}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Open drive</Link>
    </div>},
    {key:"company",header:"Company",cell:item=>item.companyName},
    {key:"type",header:"Type",cell:item=>item.type.replaceAll("_"," ")},
    {key:"location",header:"Location",cell:item=>item.locations.join(", ")||"Not specified"},
    {key:"deadline",header:"Deadline",cell:item=>item.applicationDeadline?formatter.format(item.applicationDeadline):"Not specified"},
    {key:"posted",header:"Posted",cell:item=>item.publishedAt?formatter.format(item.publishedAt):"Not posted"},
    {key:"applicants",header:"Applicants",cell:item=>item.applicants},
    {key:"status",header:"Status",cell:item=><StatusBadge tone={item.status==="PUBLISHED"?"success":item.status==="DRAFT"?"warning":"neutral"}>{item.status==="PUBLISHED"?"Live":item.status==="DRAFT"?"Draft":item.status==="CLOSED"?"Closed":item.status==="ARCHIVED"?"Archived":item.status}</StatusBadge>},
    {key:"actions",header:"Actions",mobilePriority:"action",cell:item=><Disclosure title="Manage" className="min-w-0 md:min-w-48"><div className="flex min-w-0 flex-col items-start gap-2 pb-2">
      <Link href={`/college/placements/jobs/${item.id}/applications`
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View applications</Link>
      <Link href={`/college/placements/jobs/${item.id}/settings`}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Edit</Link>
      <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
      {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id}
        title={item.title} currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
    </div></Disclosure>},
  ];

  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Drives"
      description="College-owned placement drives. This list is independent of cross-college recruiter access."
      actions={<Link href="/college/placements" className="text-link underline min-h-11 md:min-h-[var(--lms-control-height)] inline-flex items-center lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Operations workspace</Link>} />
    <form method="get" role="search" aria-label="Drive filters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title or company
        <Input type="search" name="q" defaultValue={query.q} maxLength={100}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={query.status}>
          {["PUBLISHED","DRAFT","CLOSED","ARCHIVED","ALL"].map(s=><option key={s} value={s}>{s==="PUBLISHED"?"Live":s==="DRAFT"?"Draft":s==="CLOSED"?"Closed":s==="ARCHIVED"?"Archived":s==="ALL"?"All":s}</option>)}
        </Select>
      </label>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end">
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
        {(query.q || query.status!=="PUBLISHED" || query.seasonId || query.relationshipId || query.deadlineAfter || query.deadlineBefore || query.minimumApplicants!==undefined || query.sort!=="TITLE") ? <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] underline underline-offset-4 md:min-h-9">Clear filters</Link> : null}
      </div>
      <Disclosure title="Advanced filters" defaultOpen={Boolean(query.seasonId || query.relationshipId || query.deadlineAfter || query.deadlineBefore || query.minimumApplicants!==undefined || query.sort!=="TITLE")} className="md:col-span-3">
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-3">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Season
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
      </Disclosure>
    </form>
    <Disclosure title="Bulk drives" className="min-w-0"><CollegeDriveBulkActions key={JSON.stringify(query)} drives={data.items}/></Disclosure>
    <section className="space-y-2" aria-label="Persisted drives">
      <p role="status" className="text-sm text-body">{data.total} matching persisted drives</p>
      <DataTable caption="College placement drives" columns={columns} rows={data.items}
        getRowKey={item=>item.id}
        empty={<EmptyState title={data.total===0?"No matching drives":"No drives on this page"} description={data.total===0?"No drives match these filters in this college.":"No rows on this page. Choose an earlier page."}
         action={<Link href={data.total===0?"/college/placements/drives":driveListHref({...query,page:Math.max(1,query.page-1)})} className="inline-flex min-h-11 items-center justify-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 md:min-h-9">{data.total===0?"Clear filters":"Previous page"}</Link>}/>} />
    </section>
    <nav aria-label="Drive pages" className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-sm sm:flex-row sm:items-center">
      <span>Page {data.query.page} of {data.totalPages}</span><div className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&_a]:flex-1 max-[767px]:[&_a]:justify-center">
        {query.page>1?<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-semibold text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveListHref({...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-semibold text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveListHref({...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
  </div>;
}
