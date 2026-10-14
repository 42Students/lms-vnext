import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { driveListHref, driveQueryFromSearch } from "@/modules/placements/college-drive-read-model";
import { listCollegeDrives } from "@/modules/placements/college-drive-read-service";

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
    <form method="get" className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-5">
      <label className="grid gap-1 text-sm">Title or company
        <input name="q" defaultValue={query.q} maxLength={100}
          className="min-h-10 rounded-md border border-border px-2" />
      </label>
      <label className="grid gap-1 text-sm">Status
        <select name="status" defaultValue={query.status} className="min-h-10 rounded-md border border-border px-2">
          {["ALL","DRAFT","PUBLISHED","CLOSED","ARCHIVED"].map(s=><option key={s} value={s}>{s}</option>)}
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
      <button type="submit" className="min-h-10 self-end rounded-md bg-primary px-3 font-semibold text-on-primary">Filter</button>
    </form>
    <section className="overflow-x-auto rounded-xl border border-border">
      <p className="p-3 text-sm text-muted-foreground">{data.total} matching persisted drives</p>
      {data.items.length ? <table className="w-full min-w-[42rem] text-left text-sm">
        <thead><tr className="border-y border-border bg-muted">
          <th className="p-3">Drive</th><th className="p-3">Company</th><th className="p-3">Season</th>
          <th className="p-3">Status</th><th className="p-3">Openings</th>
        </tr></thead>
        <tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border">
          <td className="p-3"><Link href={`/college/placements/jobs/${item.id}/overview`}
            className="font-semibold text-primary-text underline">{item.title}</Link></td>
          <td className="p-3">{item.companyName}</td><td className="p-3">{item.seasonName}</td>
          <td className="p-3">{item.status}</td><td className="p-3">{item.openings ?? "Not specified"}</td>
        </tr>)}</tbody>
      </table> : <p className="p-6 text-sm text-body">
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
