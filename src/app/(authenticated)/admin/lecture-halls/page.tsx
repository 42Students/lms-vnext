import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
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
  if (!collegeId) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader  title="Lecture Halls"
      description="Lecture hall administration requires an exact college safety scope." />
    <EmptyState title="Select a college to continue"
      description="Choose a college in the header above to see its lecture halls." />
  </div>;
  requireSuperAdminSelectedCollege(context,"academics.manage");

  const query = parseSuperAdminLectureHallFilters(await searchParams);
  if (!query) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader  title="Lecture Halls" />
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

  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader  title="Lecture Halls"
      description={`Rooms available for scheduling classes in ${halls.collegeName}. Changes are restricted to this selected college.`} />
    <section aria-label="Lecture hall filters" className="space-y-4 border-b border-border pb-4">
      <form action="/admin/lecture-halls" method="get" className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Room name
          <Input type="search" name="q" maxLength={100} defaultValue={query.q}
            placeholder="Search halls" className="min-h-11 min-[768px]:min-h-9"/>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={query.status} className="min-h-11 min-[768px]:min-h-9">
            <option value="ALL">All statuses</option><option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
          <Select name="departmentId" defaultValue={query.departmentId ?? ""}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Room type
          <Select name="roomType" defaultValue={query.roomType}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="ALL">All types</option>
            <option value="CLASSROOM">Classroom</option><option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Laboratory</option><option value="SEMINAR_HALL">Seminar Hall</option>
            <option value="AUDITORIUM">Auditorium</option>
            <option value="CONFERENCE_ROOM">Conference Room</option>
          </Select>
        </label>
        <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
          <Select name="pageSize" defaultValue={query.pageSize}
            className="min-h-11 min-[768px]:min-h-9">
            {[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}
          </Select>
        </label>
        <Button type="submit">Search</Button>
        <Link href="/admin/lecture-halls" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-semibold text-primary-text">Clear</Link>
      </form>
      <div className="flex flex-wrap gap-2">
        <a href={csvHref} download className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Export CSV</a>
        <form action="/admin/lecture-halls" method="get">
          {Object.entries(query).map(([name,value]) =>
            value !== undefined && value !== ""
              ? <Input key={name} type="hidden" name={name} value={String(value)} />
              : null)}
          <Button type="submit" variant="secondary">Refresh</Button>
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
    <p className="text-sm text-muted-foreground">Page {query.page} of {pages} · {query.pageSize} per page</p>
    <Pagination label="Lecture hall pages" page={query.page} pageCount={pages}
      hrefForPage={page=>superAdminLectureHallHref({...query,page})}/>
  </div>;
}
