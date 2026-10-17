import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeSemesterCreateForm, CollegeSemesterRowActions } from "@/components/academics/college-semester-management";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { academicDirectorySearchParams, collegeSemesterDirectorySchema } from "@/modules/academics/college-academic-directory-model";
import { listCollegeSemesters } from "@/modules/academics/college-academic-directory-service";

type Search = Record<string, string | string[] | undefined>;

function pageHref(query: { q: string; programId?: string; status: string; page: number; pageSize: number }) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.programId) params.set("programId", query.programId);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== 10) params.set("pageSize", String(query.pageSize));
  const encoded = params.toString();
  return "/admin/semesters" + (encoded ? "?" + encoded : "");
}

export default async function SuperAdminSemestersPage({ searchParams }: {
  searchParams: Promise<Search>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) {
    return <div className="space-y-4">
      <PageHeader eyebrow="Super Admin" title="Semesters" />
      <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its semesters." />
    </div>;
  }

  const parsed = collegeSemesterDirectorySchema.safeParse(
    academicDirectorySearchParams(await searchParams),
  );
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader eyebrow="Super Admin" title="Semesters" />
      <ErrorState title="Invalid semester filters"
        description="Check the selected program, term, status or page."
        action={<Link href="/admin/semesters" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }

  const data = await listCollegeSemesters(context, parsed.data);
  return <div className="space-y-6">
      <AcademicSetupSteps step={3} />
    <PageHeader eyebrow="Super Admin" title="Semesters"
      description="Create and manage semesters. Credits sum the mapped courses; unmapped semesters show —." />
    <CollegeSemesterCreateForm programs={data.programs.filter(program => program.status === "ACTIVE")} />
    <section className="rounded-xl border border-border bg-surface p-4" aria-label="Semester filters">
      <form method="get" action="/admin/semesters" className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Semester or program
          <input name="q" type="search" defaultValue={data.query.q} maxLength={100}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">Program
          <select name="programId" defaultValue={data.query.programId ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">All programs</option>
            {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
        </label>
        <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">Status
          <select name="status" defaultValue={data.query.status}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">Rows per page
          <select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
        <Link href="/admin/semesters" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear</Link>
      </form>
    </section>
    <form method="get" action="/admin/semesters" aria-label="Refresh semester directory">
      {data.query.q ? <input type="hidden" name="q" value={data.query.q} /> : null}
      {data.query.programId ? <input type="hidden" name="programId" value={data.query.programId} /> : null}
      <input type="hidden" name="status" value={data.query.status} />
      <input type="hidden" name="page" value={String(data.query.page)} />
      <input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
      <button type="submit" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Refresh</button>
    </form>
    <a href={"/api/admin/semesters/export?"+new URLSearchParams({
      ...(data.query.q?{q:data.query.q}:{}),
      ...(data.query.programId?{programId:data.query.programId}:{}),
      ...(data.query.status!=="ALL"?{status:data.query.status}:{})
    }).toString()} className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
      Export semesters.csv
    </a>
    <section aria-label="Semesters" className="overflow-x-auto rounded-xl border border-border bg-surface">
      <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">{data.total} matching semesters</p>
      {data.items.length === 0 ? <p className="p-5 text-sm text-body">No semesters found. Create a program first, then add semesters.</p> :
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead><tr className="bg-muted text-muted-foreground">
            <th scope="col" className="p-3">Program</th>
            <th scope="col" className="p-3">Semester #</th>
            <th scope="col" className="p-3">Name</th>
            <th scope="col" className="p-3">Credits</th>
            <th scope="col" className="p-3">Courses</th>
            <th scope="col" className="p-3">Status</th>
            <th scope="col" className="p-3">Actions</th>
          </tr></thead>
          <tbody>{data.items.map(row => <tr key={row.id} className="border-t border-border align-top">
            <td className="p-3">{row.programName}</td>
            <td className="p-3">Sem {row.termNumber}</td>
            <td className="p-3 font-semibold">{row.name}</td>
            <td className="p-3">{row.mappedCredits ?? "—"}</td>
            <td className="p-3">{row.mappedCourses}</td>
            <td className="p-3">{row.isActive ? "Active" : "Inactive"}</td>
            <td className="p-3"><CollegeSemesterRowActions row={row} /></td>
          </tr>)}</tbody>
        </table>}
    </section>
    <nav aria-label="Semester pages" className="flex flex-wrap justify-between gap-3 text-sm">
      <span>Page {data.query.page} of {data.totalPages}</span>
      <div className="flex gap-3">
        {data.query.page > 1 ? <Link href={pageHref({ ...data.query, page: data.query.page - 1 })}
          className="font-semibold text-primary-text">Previous</Link> : null}
        {data.query.page < data.totalPages ? <Link href={pageHref({ ...data.query, page: data.query.page + 1 })}
          className="font-semibold text-primary-text">Next</Link> : null}
      </div>
    </nav>
    <Link href="/admin/semester-courses" className="font-semibold text-primary-text">Semester–Course Mapping</Link>
  </div>;
}
