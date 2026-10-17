import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
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
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title="Drives"
      description="College-owned placement drives. This list is independent of cross-college recruiter access."
      actions={<Link href="/college/placements" className="text-primary-text underline">Operations workspace</Link>} />
    <form method="get" className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3 lg:grid-cols-6">
      <label className="grid gap-1 text-sm">Title or company
        <input name="q" defaultValue={query.q} maxLength={100}
          className="min-h-10 rounded-md border border-border px-2" />
      </label>
      <label className="grid gap-1 text-sm">Status
        <select name="status" defaultValue={query.status} className="min-h-10 rounded-md border border-border px-2">
          {["PUBLISHED","DRAFT","CLOSED","ARCHIVED","ALL"].map(s=><option key={s} value={s}>{s==="PUBLISHED"?"Active":s}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Season
        <select name="seasonId" defaultValue={query.seasonId ?? ""} className="min-h-10 rounded-md border border-border px-2">
          <option value="">All seasons</option>
          {data.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Company
        <select name="relationshipId" defaultValue={query.relationshipId ?? ""}
          className="min-h-10 rounded-md border border-border px-2">
          <option value="">All companies</option>
          {data.companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Deadline from
        <input type="date" name="deadlineAfter" defaultValue={query.deadlineAfter??""}
          className="min-h-10 rounded-md border border-border px-2"/>
      </label>
      <label className="grid gap-1 text-sm">Deadline on or before
        <input type="date" name="deadlineBefore" defaultValue={query.deadlineBefore??""}
          className="min-h-10 rounded-md border border-border px-2"/>
      </label>
      <label className="grid gap-1 text-sm">At least N applicants
        <input type="number" name="minimumApplicants" min={0} max={100000}
          defaultValue={query.minimumApplicants??""}
          className="min-h-10 rounded-md border border-border px-2"/>
      </label>
      <label className="grid gap-1 text-sm">Sort
        <select name="sort" defaultValue={query.sort} className="min-h-10 rounded-md border border-border px-2">
          <option value="TITLE">Title A–Z</option><option value="DEADLINE">Deadline first</option>
          <option value="NEWEST">Newest created</option><option value="APPLICANTS">Most applicants</option>
        </select>
      </label>
      <button type="submit" className="min-h-10 self-end rounded-md bg-primary px-3 font-semibold text-on-primary">Filter</button>
    </form>
    <CollegeDriveBulkActions key={JSON.stringify(query)} drives={data.items}/>
    <section className="overflow-x-auto rounded-xl border border-border">
      <p className="p-3 text-sm text-muted-foreground">{data.total} matching persisted drives</p>
      {data.items.length ? <>
        <div className="space-y-3 p-3 sm:hidden" aria-label="Drives mobile cards">
          {data.items.map(item=><article key={item.id} className="space-y-2 rounded-lg border border-border p-3">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm">{item.companyName} · {item.type.replaceAll("_"," ")}</p>
            <p className="text-xs text-muted-foreground">
              {item.locations.join(", ")||"Location not specified"} · {item.applicants} applicants
            </p>
            <p className="text-xs">Deadline: {item.applicationDeadline?
              new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.applicationDeadline)
              :"Not specified"}</p>
            <Link href={`/college/placements/jobs/${item.id}/overview`}
              className="inline-flex min-h-10 items-center font-semibold text-primary-text">Open drive</Link>
            <Link href={`/college/placements/jobs/${item.id}/applications`} className="ml-3 text-sm text-primary-text underline">Applications</Link>
            <Link href={`/college/placements/jobs/${item.id}/settings`} className="ml-3 text-sm text-primary-text underline">Edit</Link>
            <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
            {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id} title={item.title}
             currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
          </article>)}
        </div>
        <table className="hidden w-full min-w-[76rem] text-left text-sm sm:table">
          <thead><tr className="border-y border-border bg-muted">
            {["Drive","Company","Type","Location","Deadline","Posted","Applicants","Status","Actions"].map(
              label=><th key={label} className="p-3">{label}</th>)}
          </tr></thead>
          <tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border">
            <td className="p-3 font-semibold">{item.title}</td>
            <td className="p-3">{item.companyName}</td>
            <td className="p-3">{item.type.replaceAll("_"," ")}</td>
            <td className="p-3">{item.locations.join(", ")||"Not specified"}</td>
            <td className="p-3">{item.applicationDeadline?
              new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.applicationDeadline)
              :"—"}</td>
            <td className="p-3">{item.publishedAt?
              new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.publishedAt)
              :"Not posted"}</td>
            <td className="p-3 tabular-nums">{item.applicants}</td>
            <td className="p-3">{item.status}</td>
            <td className="p-3">
              <Link href={`/college/placements/jobs/${item.id}/applications`}
                className="font-semibold text-primary-text underline">View applications</Link>
              <Link href={`/college/placements/jobs/${item.id}/settings`}
                className="ml-3 font-semibold text-primary-text underline">Edit</Link>
              <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
              {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id}
               title={item.title} currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
            </td>
          </tr>)}</tbody>
        </table>
      </> : <p className="p-6 text-sm text-body">
        {data.total === 0 ? "No drives match these filters in this college." : "No rows on this page. Choose an earlier page."}
      </p>}
    </section>
    <nav aria-label="Drive pages" className="flex justify-between gap-3 text-sm">
      <span>Page {data.query.page} of {data.totalPages}</span><div className="flex gap-3">
        {query.page>1?<Link href={driveListHref({...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link href={driveListHref({...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
  </div>;
}
