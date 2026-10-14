import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminElectiveQuerySchema } from "@/modules/electives/admin-directory-model";
import { listSuperAdminElectives } from "@/modules/electives/admin-directory-service";

export default async function SuperAdminElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = adminElectiveQuerySchema.safeParse({ q: params.q, status: params.status });
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Academics" title="Electives" />
    <ErrorState title="Invalid elective filters" description="Search and status must use supported values."
      action={<Link href="/admin/electives" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  const data = await listSuperAdminElectives(context, parsed.data);
  return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Academics" title="Elective slots"
      description="Read-only elective slot records from the selected college. No learner picks, capacity guarantees or offering availability are inferred." />
    {data.state === "CHOOSE_COLLEGE" ? <EmptyState title="Choose a college"
      description="Use the Super Admin scope selector to choose a college before inspecting its elective slots." /> :
    <>
      <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="grid gap-1 text-sm font-semibold text-body">Search
          <input name="q" defaultValue={data.query.q} placeholder="Slot or program"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Status
          <select name="status" defaultValue={data.query.status}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
      </form>
      <p className="text-xs text-muted-foreground">In this page: {data.total} slots · {data.active} active · {data.archived} archived</p>
      {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
        {data.items.map(item => <article key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="m-0 break-words text-base font-semibold text-foreground">{item.name}</h2>
            <StatusBadge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{item.status}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-body">{item.programName} · Semester {item.semesterNumber}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-body">
            <div><dt className="text-xs text-muted-foreground">Academic year</dt><dd>{item.academicYear ?? "Not linked"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Credits</dt><dd>{item.credits}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Minimum picks</dt><dd>{item.minPick}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Maximum picks</dt><dd>{item.maxPick}</dd></div>
          </dl>
        </article>)}
      </div> : <EmptyState title="No elective slots" description="No persisted elective slots match the current college and filters." />}
      {data.truncated ? <p className="text-sm text-muted-foreground">Showing only 200 matching elective slots. Narrow the search for older entries.</p> : null}
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← Academic overview</Link>
  </div>;
}
