import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  COLLEGE_LECTURE_HALL_PAGE_SIZE,
  collegeLectureHallHref,
  collegeLectureHallTotalPages,
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
  if (!membership) redirect("/dashboard");

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
      <div className="min-w-0 space-y-6">
        <PageHeader eyebrow="College Admin" title="Lecture Halls" />
        <ErrorState
          title="Invalid lecture hall filters"
          description="The room search, status, type, department or page is invalid. No records were loaded."
          action={
            <Link href="/college/lecture-halls" className="font-semibold text-primary-text">
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const [result, departments] = await Promise.all([
    listLectureHalls(context, {
      collegeId: membership.collegeId,
      q: query.q || undefined,
      status: query.status === "ALL" ? undefined : query.status,
      roomType: query.roomType === "ALL" ? undefined : query.roomType,
      departmentId: query.departmentId,
      minimumCapacity: query.minimumCapacity,
      maximumCapacity: query.maximumCapacity,
      upcoming:query.upcoming==="ALL"?undefined:query.upcoming,
      limit: COLLEGE_LECTURE_HALL_PAGE_SIZE,
      offset: (query.page - 1) * COLLEGE_LECTURE_HALL_PAGE_SIZE,
    }),
    listDepartments(context, membership.collegeId),
  ]);

  const total = result.pagination.total;
  const totalPages = collegeLectureHallTotalPages(total);
  const filtered = hasCollegeLectureHallFilters(query);
  const offset = (query.page - 1) * COLLEGE_LECTURE_HALL_PAGE_SIZE;
  const shownStart = result.items.length ? offset + 1 : 0;
  const shownEnd = offset + result.items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Academic Setup"
        title="Lecture Halls"
        description={"Manage registered teaching rooms at " + result.collegeName +
          ". Find rooms by name, room type, department or archive status."}
      />

      <Link prefetch={false} download href={lectureHallsCsvHref(query)}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Export CSV
      </Link>
      <section aria-label="Lecture hall filters" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form action="/college/lecture-halls" method="get" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-sm font-semibold text-body">
            Room name
            <input type="search" name="q" maxLength={100} defaultValue={query.q}
              placeholder="Search halls"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Status
            <select name="status" defaultValue={query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Active and archived</option>
              <option value="ACTIVE">Active only</option>
              <option value="ARCHIVED">Archived only</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Room type
            <select name="roomType" defaultValue={query.roomType}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All room types</option>
              {ROOM_OPTIONS.map(({ value, label }) =>
                <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Department
            <select name="departmentId" defaultValue={query.departmentId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All departments</option>
              {departments.map((dept) =>
                <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Minimum seats
            <input name="minimumCapacity" type="number" min={1} max={5000} step={1}
              defaultValue={query.minimumCapacity ?? ""} placeholder="Any capacity"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Scheduled upcoming classes
            <select name="upcoming" defaultValue={query.upcoming}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any scheduling</option>
              <option value="YES">Upcoming classes scheduled</option>
              <option value="NO">No upcoming scheduled classes</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Maximum seats
            <input name="maximumCapacity" type="number" min={1} max={5000} step={1}
              defaultValue={query.maximumCapacity ?? ""} placeholder="Any capacity"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit"
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
              Filter
            </button>
            <Link href="/college/lecture-halls"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section aria-label="Lecture hall results" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {total} matching {total === 1 ? "hall" : "halls"}
          {result.items.length ? " · Showing " + shownStart + "–" + shownEnd : ""}
        </p>
        <LectureHallManager
          collegeId={membership.collegeId}
          halls={result.items}
          departments={departments.map((dept) => ({ id: dept.id, name: dept.name }))}
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

      <nav aria-label="Lecture hall pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Page {query.page} of {totalPages} · {COLLEGE_LECTURE_HALL_PAGE_SIZE} per page
        </span>
        <div className="flex gap-2">
          {query.page > 1 ? (
            <Link href={collegeLectureHallHref({ ...query, page: query.page - 1 })}
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
              Previous
            </Link>
          ) : null}
          {query.page < totalPages ? (
            <Link href={collegeLectureHallHref({ ...query, page: query.page + 1 })}
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
              Next
            </Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        Room changes use the existing college-scoped add/edit/archive/restore endpoints.
        Archived halls remain visible through status filtering. A room with upcoming scheduled
        classes cannot be archived until those classes are moved or cancelled.
      </p>
    </div>
  );
}
