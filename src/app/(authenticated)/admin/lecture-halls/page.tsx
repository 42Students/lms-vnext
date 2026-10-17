import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { listLectureHalls } from "@/modules/academics/lecture-hall-service";
import { listDepartments } from "@/modules/departments/service";
import { lectureHallsCsvHref } from "@/modules/academics/college-lecture-halls-export-model";
import {
  parseSuperAdminLectureHallFilters, superAdminLectureHallHref,
  superAdminLectureHallPages,
} from "@/modules/academics/super-admin-lecture-hall-directory-model";

/** SA-academics-people-26/27: all operations scoped to the selected active college. */
export default async function SuperAdminLectureHallsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;
  if (!collegeId) return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin · Academics" title="Lecture Halls"
      description="Lecture hall administration requires an exact college safety scope." />
    <EmptyState title="Select a college to continue"
      description="Choose a college in the header above to see its lecture halls." />
  </div>;

  const query = parseSuperAdminLectureHallFilters(await searchParams);
  if (!query) return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin · Academics" title="Lecture Halls" />
    <ErrorState title="Invalid lecture hall filters"
      description="Search, status, capacity or page selection is invalid. No records were loaded."
      action={<Link href="/admin/lecture-halls" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;

  const [halls, departments] = await Promise.all([
    listLectureHalls(context, {
      collegeId,
      q: query.q || undefined,
      status: query.status === "ALL" ? undefined : query.status,
      roomType: query.roomType === "ALL" ? undefined : query.roomType,
      departmentId: query.departmentId,
      minimumCapacity: query.minimumCapacity,
      maximumCapacity: query.maximumCapacity,
      upcoming: query.upcoming === "ALL" ? undefined : query.upcoming,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    }),
    listDepartments(context, collegeId),
  ]);
  const total = halls.pagination.total;
  const pages = superAdminLectureHallPages(total, query.pageSize);
  const first = halls.items.length ? (query.page - 1) * query.pageSize + 1 : 0;
  const last = first ? first + halls.items.length - 1 : 0;
  const csvHref = lectureHallsCsvHref(query).replace(
    "/api/academics/college-lecture-halls-export",
    "/api/academics/admin-lecture-halls-export",
  );

  return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin · Academics" title="Lecture Halls"
      description={`Rooms available for scheduling classes in ${halls.collegeName}. Changes are restricted to this selected college.`} />
    <section aria-label="Lecture hall filters" className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <form action="/admin/lecture-halls" method="get" className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold">Room name
          <input type="search" name="q" maxLength={100} defaultValue={query.q}
            placeholder="Search halls" className="min-h-11 rounded border border-border bg-surface px-3"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Status
          <select name="status" defaultValue={query.status} className="min-h-11 rounded border border-border bg-surface px-3">
            <option value="ALL">All statuses</option><option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Department
          <select name="departmentId" defaultValue={query.departmentId ?? ""}
            className="min-h-11 rounded border border-border bg-surface px-3">
            <option value="">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Room type
          <select name="roomType" defaultValue={query.roomType}
            className="min-h-11 rounded border border-border bg-surface px-3">
            <option value="ALL">All types</option>
            <option value="CLASSROOM">Classroom</option><option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Laboratory</option><option value="SEMINAR_HALL">Seminar Hall</option>
            <option value="AUDITORIUM">Auditorium</option>
            <option value="CONFERENCE_ROOM">Conference Room</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Rows per page
          <select name="pageSize" defaultValue={query.pageSize}
            className="min-h-11 rounded border border-border bg-surface px-3">
            {[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary">Search</button>
        <Link href="/admin/lecture-halls" className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text">Clear</Link>
      </form>
      <div className="flex flex-wrap gap-2">
        <a href={csvHref} download className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-semibold text-primary-text">Export CSV</a>
        <form action="/admin/lecture-halls" method="get">
          {Object.entries(query).map(([name,value]) =>
            value !== undefined && value !== ""
              ? <input key={name} type="hidden" name={name} value={String(value)} />
              : null)}
          <button type="submit" className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-semibold text-primary-text">Refresh</button>
        </form>
      </div>
    </section>
    <section aria-label="Lecture hall results" className="space-y-3">
      <p role="status" className="text-sm text-muted-foreground">{total} matching {total === 1 ? "hall" : "halls"} · Showing {first}–{last}</p>
      <LectureHallManager key={collegeId} collegeId={collegeId}
        availabilityBase="/admin/lecture-halls"
        halls={halls.items} departments={departments.map(d => ({ id: d.id, name: d.name }))}
        emptyState={total > 0 ? {
          title: "No halls on this page", description: "Go to an earlier page to see matching rooms.",
        } : {
          title: "No lecture halls found.", description: "Clear filters or add a lecture hall.",
        }} />
    </section>
    <nav aria-label="Lecture hall pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {query.page} of {pages} · {query.pageSize} per page</span>
      <div className="flex gap-2">
        {query.page > 1 ? <Link href={superAdminLectureHallHref({...query,page:query.page-1})}
          className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text">Previous</Link> : null}
        {query.page < pages ? <Link href={superAdminLectureHallHref({...query,page:query.page+1})}
          className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text">Next</Link> : null}
      </div>
    </nav>
  </div>;
}
