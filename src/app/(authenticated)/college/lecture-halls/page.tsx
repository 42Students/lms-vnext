import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  collegeLectureHallHref,
  hasCollegeLectureHallFilters,
  parseCollegeLectureHallSearchParams,
} from "@/modules/academics/college-lecture-hall-directory-model";
import { listLectureHalls } from "@/modules/academics/lecture-hall-service";
import { listDepartments } from "@/modules/departments/service";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { lectureHallsCsvHref } from "@/modules/academics/college-lecture-halls-export-model";

type SearchParams = Record<string, string | string[] | undefined>;

const ROOM_OPTIONS = [
  { value: "CLASSROOM", label: "Classroom" },
  { value: "LECTURE_HALL", label: "Lecture hall" },
  { value: "LAB", label: "Lab" },
  { value: "SEMINAR_HALL", label: "Seminar hall" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "CONFERENCE_ROOM", label: "Conference room" },
] as const;

export default async function CollegeLectureHallsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Lecture Halls" />
    <ErrorState title="Admin not assigned to a college"
      description="Your account is not assigned to an active college. Contact your Super Admin to restore lecture hall management access." />
  </div>;

  // This dedicated management surface must not become available through the
  // broader college/academics read permission used by other roles.
  if (!can(context, "academics.manage", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  })) {
    throw new AuthorizationError("academics.manage");
  }

  const query = parseCollegeLectureHallSearchParams(await searchParams);
  if (!query) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader title="Lecture Halls" />
        <ErrorState
          title="Invalid lecture hall filters"
          description="The room search, status, type, department or page is invalid. No records were loaded."
          action={
            <Link href="/college/lecture-halls" className="font-semibold text-link lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const pageSize = 10; // Legacy table uses ten rows per page.
  const [hallsResult, departmentsResult] = await Promise.allSettled([
    listLectureHalls(context, {
      collegeId: membership.collegeId,
      q: query.q || undefined,
      status: query.status === "ALL" ? undefined : query.status,
      roomType: query.roomType === "ALL" ? undefined : query.roomType,
      departmentId: query.departmentId,
      minimumCapacity: query.minimumCapacity,
      maximumCapacity: query.maximumCapacity,
      upcoming:query.upcoming==="ALL"?undefined:query.upcoming,
      limit: pageSize,
      offset: (query.page - 1) * pageSize,
    }),
    listDepartments(context, membership.collegeId),
  ]);

  for (const part of [hallsResult, departmentsResult]) {
    if (part.status==="rejected" && part.reason instanceof AuthorizationError) throw part.reason;
  }
  if (hallsResult.status==="rejected") return <div className="min-w-0 space-y-4">
    <PageHeader title="Lecture Halls" />
    <Alert tone="error" title="Could not load lecture halls">
      The hall directory could not be refreshed. Your filters and existing room records were not changed.
    </Alert>
    <ErrorState title="Lecture halls unavailable"
      description="Retry the same college-scoped room search or clear filters."
      action={<Link href={collegeLectureHallHref(query)} className="font-semibold text-link underline underline-offset-4">Retry lecture halls</Link>} />
  </div>;
  const result=hallsResult.value;
  const departments=departmentsResult.status==="fulfilled"?departmentsResult.value:[];
  // When department choices fail, preserve any department referenced by a
  // loaded row so editing that hall never silently clears its current link.
  const managerDepartments=[...departments.map(dept=>({id:dept.id,name:dept.name}))];
  for (const hall of result.items) {
    if (hall.departmentId && !managerDepartments.some(dept=>dept.id===hall.departmentId)) {
      managerDepartments.push({id:hall.departmentId,name:hall.departmentName??"Current hall department"});
    }
  }
  const total = result.pagination.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filtered = hasCollegeLectureHallFilters(query);
  const offset = (query.page - 1) * pageSize;
  const shownStart = result.items.length ? offset + 1 : 0;
  const shownEnd = offset + result.items.length;

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        title="Lecture Halls"
        description={"Manage registered teaching rooms at " + result.collegeName +
          ". Find rooms by name, room type, department or archive status."}
      />

      {departmentsResult.status==="rejected" ? <Alert tone="warning" title="Departments could not be loaded">
        The lecture hall register is available. Department is optional when adding a room; leave it blank until the department list is restored.
        {" "}<Link href={collegeLectureHallHref(query)} className="font-semibold text-link underline underline-offset-4">Retry departments</Link>.
        An existing hall's recorded department remains intact when edited.
      </Alert> : null}
      <section aria-label="Lecture hall results" className="min-w-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          {result.items.length ? "Showing "+shownStart+"–"+shownEnd+" of "+total :
            "0 of "+total} {total===1?"hall":"halls"} · Stats retrieved
        </p>
        <LectureHallManager
          collegeId={membership.collegeId}
          halls={result.items.map(hall=>({...hall,name:hall.name?.trim()||"Unnamed lecture hall"}))}
          departments={managerDepartments}
          emptyState={total > 0
            ? {
                title: "No halls on this page",
                description: "Choose an earlier page or reset the filters to see the matching rooms.",
              }
            : filtered
              ? {
                  title: "No matching lecture halls",
                  description: "No registered rooms match these filters. Clear them or add a new hall.",
                }
              : undefined}
        />
      </section>

      <details open={filtered || undefined} className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text md:min-h-9">Advanced lecture hall filters</summary>
      <section aria-label="Lecture hall filters" className="min-w-0 pt-3">
        <form action="/college/lecture-halls" method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-2 min-[992px]:grid-cols-4">
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Room name
            <Input type="search" name="q" maxLength={100} defaultValue={query.q}
              placeholder="Search halls"
              className="w-full" />
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Status
            <Select name="status" defaultValue={query.status}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Active and archived</option>
              <option value="ACTIVE">Active only</option>
              <option value="ARCHIVED">Archived only</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Room type
            <Select name="roomType" defaultValue={query.roomType}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All room types</option>
              {ROOM_OPTIONS.map(({ value, label }) =>
                <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Department
            <Select name="departmentId" defaultValue={query.departmentId ?? ""}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="">All departments</option>
              {query.departmentId && !departments.some(dept=>dept.id===query.departmentId) ?
                <option value={query.departmentId}>Selected department (unavailable in lookup)</option> : null}
              {departments.map((dept) =>
                <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </Select>
          </label>
          <details className="min-w-0 border-t border-border pt-2 md:col-span-2 min-[992px]:col-span-4" open={Boolean(query.minimumCapacity||query.maximumCapacity||query.upcoming!=="ALL")||undefined}>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
            <div className="grid min-w-0 grid-cols-1 gap-3 pt-3 md:grid-cols-2 min-[992px]:grid-cols-3">
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Minimum seats
            <Input name="minimumCapacity" type="number" min={1} max={5000} step={1}
              defaultValue={query.minimumCapacity ?? ""} placeholder="Any capacity"
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Scheduled upcoming classes
            <Select name="upcoming" defaultValue={query.upcoming}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any scheduling</option>
              <option value="YES">Upcoming classes scheduled</option>
              <option value="NO">No upcoming scheduled classes</option>
            </Select>
          </label>
          <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Maximum seats
            <Input name="maximumCapacity" type="number" min={1} max={5000} step={1}
              defaultValue={query.maximumCapacity ?? ""} placeholder="Any capacity"
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
            </div>
          </details>
          <div className="flex min-w-0 flex-wrap items-end gap-2 max-[767px]:flex-col max-[767px]:items-stretch md:col-span-2 min-[992px]:col-span-4">
            <Button variant="primary" type="submit"
              className="min-h-11 w-full px-4 md:min-h-9 md:w-auto">
              Filter
            </Button>
            <Link href="/college/lecture-halls"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-link md:min-h-9 md:w-auto hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
              Clear
            </Link>
          </div>
          <Link href={lectureHallsCsvHref(query)} download prefetch={false}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
            Export all matching halls (CSV)
          </Link>
        </form>
      </section>
      </details>

      <nav aria-label="Lecture hall pages" className="flex min-w-0 flex-col items-stretch gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">
          Page {query.page} of {totalPages} · {pageSize} per page
        </span>
<Pagination label="Lecture hall pages" page={query.page} pageCount={totalPages}
          hrefForPage={page=>collegeLectureHallHref({...query,page})}/>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        Room changes use the existing college-scoped add/edit/archive/restore endpoints.
        Archived halls remain visible through status filtering. A room with upcoming scheduled
        classes cannot be archived until those classes are moved or cancelled.
      </p>
    </div>
  );
}
