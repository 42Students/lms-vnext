import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeClassCreate, CollegeClassRowActions } from "@/components/academics/college-section-management";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";
import { collegeClassQuerySchema, collegeStructureHref, type CollegeClassQuery } from "@/modules/academics/college-structure-directory-model";

const statuses = ["ALL", "ACTIVE", "ARCHIVED"] as const;
const pageUrl = (query: CollegeClassQuery) => collegeStructureHref("CLASSES", query).replace("/college/classes", "/admin/classes");
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminClassesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const filter = collegeClassQuerySchema.safeParse({
    q: raw.q, programId: raw.programId || undefined, cohortCode: raw.cohortCode || undefined, status: raw.status, page: raw.page, pageSize: raw.pageSize,
  });
  const [data, options] = selected && filter.success
    ? await Promise.all([
        listCollegeClasses(context, filter.data),
        listCollegeSectionOptions(context),
      ])
    : [null, null];
  return <div className="space-y-6">
      <AcademicSetupSteps step={6} />
    {data && options ? <>
      <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />
      <section aria-label="Filter managed classes" className="rounded-xl border border-border bg-surface p-4">
        <form method="get" action="/admin/classes" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-44 gap-1 text-sm font-semibold text-body">Program
            <select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">Batch code
            <input name="cohortCode" defaultValue={data.query.cohortCode ?? ""} placeholder="Search batch code"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Search class, program or batch
            <input name="q" type="search" defaultValue={data.query.q}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">Rows per page
            <select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
          <Link href="/admin/classes" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear filters</Link>
        </form>
      </section>
      <section aria-label="Manage classes" className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Manage classes</h2>
        <p className="text-sm text-muted-foreground">Edit class names, codes and capacities within the selected college.</p>
        {data.items.length === 0 ? <p>No matching classes on this page.</p> :
          <div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm">
            <thead><tr><th className="p-2">Class</th><th className="p-2">Program</th><th className="p-2">Batch</th>
              <th className="p-2">Description</th><th className="p-2">Students</th><th className="p-2">Max Students</th><th className="p-2">Actions</th></tr></thead>
            <tbody>{data.items.map(row => <tr key={row.id} className="border-t border-border">
              <td className="p-2">{row.name} ({row.code})
                <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}`} className="mt-1 block text-xs font-semibold text-primary-text">Manage students →</Link>
                <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}#section-schedule`} className="mt-1 block text-xs font-semibold text-primary-text">Schedule →</Link></td>
              <td className="p-2">{row.programName}</td>
              <td className="p-2">{row.cohortName}</td>
              <td className="p-2">{row.description?.trim() || "—"}</td>
              <td className="p-2">{row.activeLearners}</td>
              <td className="p-2">{row.capacity ?? "—"}</td>
              <td className="p-2"><CollegeClassRowActions row={row} /></td>
            </tr>)}</tbody>
          </table></div>}
        <nav aria-label="Class pages" className="flex items-center justify-between gap-3 text-sm">
          <span>{data.total} classes · Page {data.query.page} of {data.totalPages}</span>
          <div className="flex gap-3">
            {data.query.page>1?<Link href={pageUrl({...data.query,page:data.query.page-1})}>Previous</Link>:null}
            {data.query.page<data.totalPages?<Link href={pageUrl({...data.query,page:data.query.page+1})}>Next</Link>:null}
          </div>
        </nav>
        <Link href="/admin/batch-promotion" className="inline-flex min-h-10 items-center font-semibold text-primary-text">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
  </div>;
}
