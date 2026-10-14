import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeTermMappingManager } from "@/components/academics/college-term-mapping-manager";
import { listCollegeTermMappings } from "@/modules/academics/college-term-mapping-service";
import { semesterCourseQuerySchema, collegeMappingHref } from "@/modules/academics/college-mapping-model";
import { listCollegeSemesterCourseMappings } from "@/modules/academics/college-mapping-service";
import { offeringMappingCsvHref } from "@/modules/academics/college-mapping-export-model";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollegeSemesterCoursesPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = semesterCourseQuerySchema.safeParse(
    Object.fromEntries(
      Object.entries({
        q: first(raw.q),
        programId: first(raw.programId),
        periodId: first(raw.periodId),
        type: first(raw.type),
        page: first(raw.page),
      }).filter(([, value]) => value !== undefined && value !== ""),
    ),
  );
  if (!parsed.success) return (
    <div className="space-y-5">
      <PageHeader eyebrow="College Admin · Academic Setup" title="Semester–Course Mapping" />
      <ErrorState title="Invalid mapping filters"
        description="The supplied program, academic period, page or search is invalid. No data was loaded."
        action={<Link href="/college/semester-courses" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>
  );
  const [offeringData, curriculumData] = await Promise.all([
    listCollegeSemesterCourseMappings(context, parsed.data),
    listCollegeTermMappings(context),
  ]);
  const { query, items, total, totalPages, programs, periods } = offeringData;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Academic Setup"
        title="Semester–Course Mapping"
        description="Read-only persisted course offerings by program, cohort and academic period. This is not yet the exact legacy numbered-semester mapping."
        actions={<Link href="/college/courses"
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Course offerings
        </Link>}
      />
      <Link prefetch={false} href={offeringMappingCsvHref(query)}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Export filtered offering mappings CSV
      </Link>
      <CollegeTermMappingManager data={curriculumData} />
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form action="/college/semester-courses" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-body">
            Course / cohort search
            <input name="q" type="search" defaultValue={query.q} maxLength={100}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Program
            <select name="programId" defaultValue={query.programId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Academic period
            <select name="periodId" defaultValue={query.periodId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All academic periods</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Offering type
            <select name="type" defaultValue={query.type}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All types</option>
              <option value="CORE">Core</option>
              <option value="ELECTIVE">Elective</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
            <Link href="/college/semester-courses"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
          </div>
        </form>
      </section>
      <section className="overflow-x-auto rounded-xl border border-border bg-surface" aria-label="Persisted course mappings">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {total} matching offering{total === 1 ? "" : "s"}
        </p>
        {items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {total === 0
              ? "No persisted course offerings match these filters. No semester-to-course mappings are inferred."
              : "No rows on this page. Choose an earlier page."}
          </p>
        ) : (
          <table className="w-full min-w-[47rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground"><tr>
              <th scope="col" className="px-4 py-3">Course</th>
              <th scope="col" className="px-4 py-3">Program / cohort</th>
              <th scope="col" className="px-4 py-3">Academic period</th>
              <th scope="col" className="px-4 py-3">Type / credits</th>
              <th scope="col" className="px-4 py-3">State</th>
            </tr></thead>
            <tbody>{items.map(item => <tr key={item.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <Link href={"/college/courses/offerings/" + encodeURIComponent(item.id)}
                  className="font-semibold text-primary-text hover:underline">
                  {item.courseName}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{item.courseCode}</p>
              </td>
              <td className="px-4 py-3 text-body">{item.programName} · {item.cohortName}</td>
              <td className="px-4 py-3 text-body">{item.periodName} ({item.periodCode})</td>
              <td className="px-4 py-3 text-body">{item.type} · {item.credits ?? "Not recorded"} credits</td>
              <td className="px-4 py-3 text-body">{item.status}</td>
            </tr>)}</tbody>
          </table>
        )}
      </section>
      <nav aria-label="Course mapping pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {query.page} of {totalPages} · 25/page</span>
        <div className="flex gap-2">
          {query.page > 1 ? <Link className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text"
            href={collegeMappingHref("SEMESTER_COURSES", { ...query, page: query.page - 1 })}>Previous</Link> : null}
          {query.page < totalPages ? <Link className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text"
            href={collegeMappingHref("SEMESTER_COURSES", { ...query, page: query.page + 1 })}>Next</Link> : null}
        </div>
      </nav>
      <p className="text-xs text-muted-foreground">
        Academic periods are not necessarily legacy semester numbers. No add/remove mapping mutation,
        semester credit total, or historical semester designation is implied by this view.
      </p>
    </div>
  );
}
