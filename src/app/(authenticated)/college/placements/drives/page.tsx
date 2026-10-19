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

export default async function CollegeDrivesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const query = driveQueryFromSearch(await searchParams);
  if (!query) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin · Placements" title="Drives" />
    <ErrorState title="Invalid drive filters" description="Search, status, season, company or page is invalid."
      action={<Link href="/college/placements/drives">Clear filters</Link>} />
  </div>;
  const data = await listCollegeDrives(context, query);
  const formatter = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"drive",header:"Drive",mobilePriority:"primary",cell:item=><div className="min-w-0">
      <p className="break-words font-semibold">{item.title}</p>
      <Link href={`/college/placements/jobs/${item.id}/overview`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open drive</Link>
    </div>},
    {key:"company",header:"Company",cell:item=>item.companyName},
    {key:"type",header:"Type",cell:item=>item.type.replaceAll("_"," ")},
    {key:"location",header:"Location",cell:item=>item.locations.join(", ")||"Not specified"},
    {key:"deadline",header:"Deadline",cell:item=>item.applicationDeadline?formatter.format(item.applicationDeadline):"Not specified"},
    {key:"posted",header:"Posted",cell:item=>item.publishedAt?formatter.format(item.publishedAt):"Not posted"},
    {key:"applicants",header:"Applicants",cell:item=>item.applicants},
    {key:"status",header:"Status",cell:item=>item.status},
    {key:"actions",header:"Actions",mobilePriority:"action",cell:item=><div className="flex min-w-0 flex-wrap items-center gap-2">
      <Link href={`/college/placements/jobs/${item.id}/applications`}
        className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View applications</Link>
      <Link href={`/college/placements/jobs/${item.id}/settings`}
        className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Edit</Link>
      <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
      {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id}
        title={item.title} currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
    </div>},
  ];

  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title="Drives"
      description="College-owned placement drives. This list is independent of cross-college recruiter access."
      actions={<Link href="/college/placements" className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 inline-flex items-center">Operations workspace</Link>} />
    <form method="get" role="search" aria-label="Drive filters" className="grid gap-3 rounded-[8px] border border-border p-4 sm:grid-cols-3 lg:grid-cols-6">
      <label className="grid gap-1 text-sm">Title or company
        <input name="q" defaultValue={query.q} maxLength={100}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm" />
      </label>
      <label className="grid gap-1 text-sm">Status
        <Select name="status" defaultValue={query.status} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          {["PUBLISHED","DRAFT","CLOSED","ARCHIVED","ALL"].map(s=><option key={s} value={s}>{s==="PUBLISHED"?"Active":s}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Season
        <Select name="seasonId" defaultValue={query.seasonId ?? ""} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="">All seasons</option>
          {data.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Company
        <Select name="relationshipId" defaultValue={query.relationshipId ?? ""}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="">All companies</option>
          {data.companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Deadline from
        <input type="date" name="deadlineAfter" defaultValue={query.deadlineAfter??""}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm"/>
      </label>
      <label className="grid gap-1 text-sm">Deadline on or before
        <input type="date" name="deadlineBefore" defaultValue={query.deadlineBefore??""}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm"/>
      </label>
      <label className="grid gap-1 text-sm">At least N applicants
        <input type="number" name="minimumApplicants" min={0} max={100000}
          defaultValue={query.minimumApplicants??""}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm"/>
      </label>
      <label className="grid gap-1 text-sm">Sort
        <Select name="sort" defaultValue={query.sort} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="TITLE">Title A–Z</option><option value="DEADLINE">Deadline first</option>
          <option value="NEWEST">Newest created</option><option value="APPLICANTS">Most applicants</option>
        </Select>
      </label>
      <button type="submit" className="min-h-11 self-end rounded-[var(--lms-control-radius)] bg-primary px-3 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary inline-flex items-center">Filter</button>
    </form>
    <CollegeDriveBulkActions key={JSON.stringify(query)} drives={data.items}/>
    <section className="space-y-2" aria-label="Persisted drives">
      <p role="status" className="text-sm text-body">{data.total} matching persisted drives</p>
      <DataTable caption="College placement drives" columns={columns} rows={data.items}
        getRowKey={item=>item.id}
        empty={<p role="status" className="text-sm text-body">
          {data.total===0?"No drives match these filters in this college.":"No rows on this page. Choose an earlier page."}
        </p>} />
    </section>
    <nav aria-label="Drive pages" className="flex justify-between gap-3 text-sm">
      <span>Page {data.query.page} of {data.totalPages}</span><div className="flex gap-3">
        {query.page>1?<Link href={driveListHref({...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link href={driveListHref({...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
  </div>;
}
