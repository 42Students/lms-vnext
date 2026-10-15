import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import {
  CollegeFacultyAssignmentCreate,
  CollegeFacultyAssignmentEnd,
} from "@/components/college/college-faculty-assignment-actions";
import { listCollegeTeachingOptions } from "@/modules/courses/college-teaching-options-service";
import {CollegeFacultyReassignAction} from "@/components/college/college-faculty-reassign-action";
import { PageHeader } from "@/components/ui/page-header";
import { facultyAssignmentQuerySchema, collegeMappingHref } from "@/modules/academics/college-mapping-model";
import { listCollegeFacultyAssignments } from "@/modules/academics/college-mapping-service";
import { facultyAssignmentCsvHref } from "@/modules/academics/college-faculty-assignment-export-model";

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
      q: first(raw.q), status: first(raw.status), role: first(raw.role), page: first(raw.page),
      courseCode: first(raw.courseCode),
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

  const [directory, options] = await Promise.all([
    listCollegeFacultyAssignments(context, parsed.data),
    listCollegeTeachingOptions(context),
  ]);
  const { query, items, total, totalPages } = directory;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · People"
        title="Faculty Assignment"
        description="Manage persisted teaching assignments for live course/class deliveries in your college. Ending an assignment retains its history."
        actions={<Link href="/college/faculty"
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Faculty directory</Link>}
      />
      <Link prefetch={false} download href={facultyAssignmentCsvHref(query)}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Export filtered faculty assignments CSV
      </Link>
      <CollegeFacultyAssignmentCreate {...options} />
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form action="/college/faculty-assignment" method="get" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold text-body">
            Faculty, course or class
            <input name="q" type="search" defaultValue={query.q} maxLength={100}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold text-body">
            Exact course code
            <input name="courseCode" defaultValue={query.courseCode ?? ""} maxLength={64}
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
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Teaching role
            <select name="role" defaultValue={query.role}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All roles</option>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-teacher</option>
              <option value="TA">Teaching assistant</option>
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
              <th scope="col" className="px-4 py-3">Actions</th>
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
              <td className="px-4 py-3">
                {item.state === "ACTIVE" ? (
                  <div className="flex flex-wrap gap-2">
                    <CollegeFacultyAssignmentEnd
                      assignmentId={item.id}
                      facultyName={item.facultyName}
                      courseName={item.courseName}
                      role={item.role}
                    />
                    <CollegeFacultyReassignAction
                      assignmentId={item.id}
                      facultyName={item.facultyName}
                      role={item.role}
                      oldMembershipId={item.membershipId}
                      expectedUpdatedAt={item.updatedAt.toISOString()}
                      faculty={options.faculty}
                    />
                  </div>
                ) : <span className="text-xs text-muted-foreground">Historical</span>}
              </td>
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
        Assignment changes require confirmation and produce audit records. A second primary teacher
        or an already assigned faculty member cannot be added to the same live delivery.
        Class scheduling and automatic reassignment remain offering-level workflows.
      </p>
    </div>
  );
}
