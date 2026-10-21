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
      description="Choose a college in the header above to see its lecture halls. This workspace requires one selected college; global multi-college search is not available." />
  </div>;
  requireSuperAdminSelectedCollege(context,"academics.manage");

  const query = parseSuperAdminLectureHallFilters(await searchParams);
  if (!query) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader  title="Lecture Halls" />
    <ErrorState title="Invalid lecture hall filters"
      description="Search, status, capacity or page selection is invalid. No records were loaded."
      action={<Link href="/admin/lecture-halls" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;

  // Departments are optional filter metadata: their failure must not hide
  // otherwise authorized halls or the inline create card.
  const [hallResult, departmentResult] = await Promise.allSettled([
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
  const departments = departmentResult.status==="fulfilled"?departmentResult.value:[];
  if(hallResult.status==="rejected")return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lecture Halls" description="Create and maintain lecture halls in the selected college."/>
    <ErrorState title="Could not load lecture halls"
      description="The existing lecture hall list could not be loaded. Creation is still available; no unverified rooms are displayed."
      action={<Link href={superAdminLectureHallHref(query)} className="font-semibold text-primary-text underline">Retry halls</Link>}/>
    {departmentResult.status==="rejected"?<p role="alert" className="text-sm text-warning">
      Departments could not be loaded.{" "}
      <Link href={superAdminLectureHallHref(query)} className="font-semibold underline">Retry departments</Link>.
    </p>:null}
    <LectureHallManager key={collegeId} collegeId={collegeId}
      availabilityBase="/admin/lecture-halls" halls={[]} departments={departments.map(d=>({id:d.id,name:d.name}))}
      emptyState={{title:"Could not load lecture halls",description:"Retry the existing rooms list before making changes to a room."}}/>
  </div>;
  const halls=hallResult.value;
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
    <section aria-label="Lecture hall filters" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
      <form action="/admin/lecture-halls" method="get" aria-label="Filter lecture halls" className="min-w-0 space-y-[var(--lms-space-3)]">
        <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
          <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Room name
            <Input type="search" name="q" maxLength={100} defaultValue={query.q}
              placeholder="Search halls" className="min-h-11 w-full md:min-h-9" />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
            <Select name="status" defaultValue={query.status} className="min-h-11 w-full md:min-h-9">
              <option value="ALL">All statuses</option><option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Search</Button>
        </div>
        <details className="group min-w-0" open={Boolean(query.departmentId || query.roomType !== "ALL" || query.pageSize !== 10 || query.minimumCapacity || query.maximumCapacity || query.upcoming !== "ALL") || undefined}>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
          <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
              <Select name="departmentId" defaultValue={query.departmentId ?? ""} className="min-h-11 w-full md:min-h-9">
                <option value="">All departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Room type
              <Select name="roomType" defaultValue={query.roomType} className="min-h-11 w-full md:min-h-9">
                <option value="ALL">All types</option><option value="CLASSROOM">Classroom</option>
                <option value="LECTURE_HALL">Lecture Hall</option><option value="LAB">Laboratory</option>
                <option value="SEMINAR_HALL">Seminar Hall</option><option value="AUDITORIUM">Auditorium</option>
                <option value="CONFERENCE_ROOM">Conference Room</option>
              </Select>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
              <Select name="pageSize" defaultValue={query.pageSize} className="min-h-11 w-full md:min-h-9">
                {[10,25,50,100].map(size => <option key={size} value={size}>{size}</option>)}
              </Select>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum seats
              <Input type="number" name="minimumCapacity" min={1} max={5000} step={1} defaultValue={query.minimumCapacity ?? ""} placeholder="Any capacity" className="min-h-11 w-full md:min-h-9" />
            </label>
            <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum seats
              <Input type="number" name="maximumCapacity" min={1} max={5000} step={1} defaultValue={query.maximumCapacity ?? ""} placeholder="Any capacity" className="min-h-11 w-full md:min-h-9" />
            </label>
            <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Scheduled upcoming classes
              <Select name="upcoming" defaultValue={query.upcoming} className="min-h-11 w-full md:min-h-9">
                <option value="ALL">Any scheduling</option>
                <option value="YES">Upcoming classes scheduled</option>
                <option value="NO">No upcoming scheduled classes</option>
              </Select>
            </label>
          </div>
        </details>
      </form>
      <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-2)]">
        <Link href="/admin/lecture-halls" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Clear</Link>
        <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
          <a href={csvHref} download className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Export CSV</a>
          <form action="/admin/lecture-halls" method="get" aria-label="Refresh Lecture Halls 2">
            {Object.entries(query).map(([name,value]) => value !== undefined && value !== ""
              ? <Input key={name} type="hidden" name={name} value={String(value)} /> : null)}
            <Button type="submit" variant="secondary">Refresh</Button>
          </form>
        </div>
      </div>
    </section>
    <section aria-label="Lecture hall results" className="min-w-0 space-y-[var(--lms-space-3)]">
      {departmentResult.status==="rejected"?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm">
        Departments could not be loaded. Rooms remain visible. Department filter choices are unavailable.{" "}
        <Link href={superAdminLectureHallHref(query)} className="font-semibold text-primary-text underline">Retry departments</Link>.
      </p>:null}
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
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">Page {query.page} of {pages} · {query.pageSize} per page</p>
      <Pagination label="Lecture hall pages" page={query.page} pageCount={pages}
        hrefForPage={page=>superAdminLectureHallHref({...query,page})}/>
    </div>
  </div>;
}
