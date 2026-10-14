import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { facultyAssignmentQuerySchema, collegeMappingHref } from "@/modules/academics/college-mapping-model";
import { listCollegeFacultyAssignments } from "@/modules/academics/college-mapping-service";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollegeFacultyAssignmentPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = facultyAssignmentQuerySchema.safeParse(
    Object.fromEntries(Object.entries({
      q: first(raw.q), status: first(raw.status), page: first(raw.page),
    }).filter(([, value]) => value !== undefined && value !== "")),
  );
  if (!parsed.success) return (
    <div className="space-y-5">
      <PageHeader eyebrow="College Admin · People" title="Faculty Assignment" />
      <ErrorState title="Invalid assignment filters"
        description="The status, page or search is invalid; no assignments were loaded."
        action={<Link href="/college/faculty-assignment"
          className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>
  );

  const { query, items, total, totalPages } =
    await listCollegeFacultyAssignments(context, parsed.data);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · People"
        title="Faculty Assignment"
        description="Read-only assignment roster from persisted teaching ownership and section deliveries in your college."
        actions={<Link href="/college/faculty"
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Faculty directory</Link>}
      />
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form action="/college/faculty-assignment" method="get" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold text-body">
            Faculty, course or class
            <input name="q" type="search" defaultValue={query.q} maxLength={100}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Assignment lifecycle
            <select name="status" defaultValue={query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
              <option value="ALL">All</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
          <Link href="/college/faculty-assignment"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
        </form>
      </section>
      <section className="overflow-x-auto rounded-xl border border-border bg-surface" aria-label="Teaching assignment roster">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {total} matching teaching assignment{total === 1 ? "" : "s"}
        </p>
        {items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {total === 0
              ? "No persisted teaching assignments match these filters. Unassigned faculty are listed separately in the Faculty directory."
              : "No assignments on this page. Choose an earlier page."}
          </p>
        ) : (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground"><tr>
              <th scope="col" className="px-4 py-3">Faculty / role</th>
              <th scope="col" className="px-4 py-3">Course</th>
              <th scope="col" className="px-4 py-3">Batch / class</th>
              <th scope="col" className="px-4 py-3">Period</th>
              <th scope="col" className="px-4 py-3">Lifecycle</th>
            </tr></thead>
            <tbody>{items.map(item => <tr key={item.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-foreground">{item.facultyName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
              </td>
              <td className="px-4 py-3">
                <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                  className="font-semibold text-primary-text hover:underline">
                  {item.courseName}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{item.courseCode}</p>
              </td>
              <td className="px-4 py-3 text-body">{item.cohortName} · {item.sectionName}</td>
              <td className="px-4 py-3 text-body">{item.periodName}</td>
              <td className="px-4 py-3 text-body">{item.state}</td>
            </tr>)}</tbody>
          </table>
        )}
      </section>
      <nav aria-label="Faculty assignment pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {query.page} of {totalPages} · 25/page</span>
        <div className="flex gap-2">
          {query.page > 1 ? <Link className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text"
            href={collegeMappingHref("FACULTY_ASSIGNMENTS", { ...query, page: query.page - 1 })}>Previous</Link> : null}
          {query.page < totalPages ? <Link className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text"
            href={collegeMappingHref("FACULTY_ASSIGNMENTS", { ...query, page: query.page + 1 })}>Next</Link> : null}
        </div>
      </nav>
      <p className="text-xs text-muted-foreground">
        Ended means the teaching assignment or its delivery has ended; no reassignment, duplication,
        section scheduling, or confirmation action is performed on this page.
      </p>
    </div>
  );
}
