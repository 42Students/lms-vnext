import Link from "next/link";
import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
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
import { DataTable } from "@/components/ui/data-table";
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
      courseCode: first(raw.courseCode), sectionCode: first(raw.sectionCode),
    }).filter(([, value]) => value !== undefined && value !== "")),
  );
  if (!parsed.success) return (
    <div className="space-y-5">
      <PageHeader eyebrow="College Admin · People" title="Faculty Assignment" />
      <ErrorState title="Invalid assignment filters"
        description="The status, page or search is invalid; no assignments were loaded."
        action={<Link href="/college/faculty-assignment"
          className="font-semibold text-link">Clear filters</Link>} />
    </div>
  );

  const [directory, options] = await Promise.all([
    listCollegeFacultyAssignments(context, parsed.data),
    listCollegeTeachingOptions(context),
  ]);
  const { query, items, total, totalPages } = directory;
  const classChoices=Array.from(
    new Map(options.deliveries.map(item=>[item.sectionCode,{code:item.sectionCode,name:item.sectionName}])).values(),
  ).sort((a,b)=>a.name.localeCompare(b.name)||a.code.localeCompare(b.code));
  return (
    <div className="min-w-0 overflow-x-clip space-y-6">
      <PageHeader
        eyebrow="College Admin · People"
        title={FACULTY_ASSIGNMENT_COPY.title}
        description={FACULTY_ASSIGNMENT_COPY.description}
        actions={<Link href="/college/faculty"
          className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">Faculty directory</Link>}
      />
      <Link prefetch={false} download href={facultyAssignmentCsvHref(query)}
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
        Export filtered faculty assignments CSV
      </Link>
      <CollegeFacultyAssignmentCreate {...options} />
      <section className="border-t border-border pt-4">
        <form action="/college/faculty-assignment" method="get" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-0 sm:min-w-56 flex-1 gap-1 text-sm font-semibold text-body">
            Faculty, course or class
            <input name="q" type="search" defaultValue={query.q} maxLength={100}
              className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm" />
          </label>
          <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold text-body">
            Exact course code
            <input name="courseCode" defaultValue={query.courseCode ?? ""} maxLength={64}
              className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm" />
          </label>
          <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold text-body">
            Class
            <select name="sectionCode" defaultValue={query.sectionCode ?? ""}
              className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm">
              <option value="">All classes</option>
              {query.sectionCode&&!classChoices.some(item=>item.code===query.sectionCode)?
                <option value={query.sectionCode}>Selected class ({query.sectionCode})</option>:null}
              {classChoices.map(item=><option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}
            </select>
            {options.deliveriesTruncated?<span className="text-xs font-normal text-muted-foreground">
              First 200 active deliveries shown; a selected class outside this list is retained.
            </span>:null}
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Assignment lifecycle
            <select name="status" defaultValue={query.status}
              className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm">
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
              <option value="ALL">All</option>
            </select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            {FACULTY_ASSIGNMENT_COPY.roleLabel}
            <select name="role" defaultValue={query.role}
              className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-base sm:text-sm">
              <option value="ALL">All roles</option>
              <option value="PRIMARY">{FACULTY_ASSIGNMENT_ROLE_LABELS.PRIMARY}</option>
              <option value="CO_TEACHER">{FACULTY_ASSIGNMENT_ROLE_LABELS.CO_TEACHER}</option>
              <option value="TA">{FACULTY_ASSIGNMENT_ROLE_LABELS.TA}</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
          <Link href="/college/faculty-assignment"
            className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">Clear</Link>
        </form>
      </section>
      <section className="min-w-0 rounded-[8px] border border-border bg-surface" aria-label="Teaching assignment roster">
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
          <DataTable
            caption="Teaching assignment roster"
            rows={items}
            getRowKey={item => item.id}
            empty={<p className="text-sm text-body">No persisted teaching assignments match these filters. Unassigned faculty are listed separately in the Faculty directory.</p>}
            columns={[
              { key: "faculty", header: FACULTY_ASSIGNMENT_COPY.columns.faculty,
                mobilePriority: "primary", cell: item => item.facultyName },
              { key: "course", header: FACULTY_ASSIGNMENT_COPY.columns.course,
                mobilePriority: "secondary", cell: item => <>
                  <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                    className="font-semibold text-link hover:underline">
                    {item.courseName}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.courseCode}</p>
                </> },
              { key: "class", header: FACULTY_ASSIGNMENT_COPY.columns.class,
                mobilePriority: "secondary", cell: item => item.cohortName + " · " + item.sectionName },
              { key: "period", header: "Period", mobilePriority: "secondary",
                cell: item => item.periodName },
              { key: "role", header: FACULTY_ASSIGNMENT_COPY.columns.role,
                mobilePriority: "secondary", cell: item => facultyAssignmentRoleLabel(item.role) },
              { key: "active", header: FACULTY_ASSIGNMENT_COPY.columns.active,
                mobilePriority: "secondary", cell: item => item.state === "ACTIVE" ? FACULTY_ASSIGNMENT_COPY.yes : FACULTY_ASSIGNMENT_COPY.no },
              { key: "actions", header: FACULTY_ASSIGNMENT_COPY.columns.actions,
                mobilePriority: "action", cell: item => item.state === "ACTIVE" ? (
                  <div className="flex flex-wrap gap-2">
                    <CollegeFacultyAssignmentEnd
                      assignmentId={item.id} facultyName={item.facultyName}
                      courseName={item.courseName} role={item.role}
                    />
                    <CollegeFacultyReassignAction
                      assignmentId={item.id} facultyName={item.facultyName}
                      role={item.role} oldMembershipId={item.membershipId}
                      expectedUpdatedAt={item.updatedAt.toISOString()}
                      faculty={options.faculty}
                    />
                  </div>
                ) : <span className="text-xs text-muted-foreground">Historical</span> },
            ]}
          />
        )}
      </section>
      <nav aria-label="Faculty assignment pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {query.page} of {totalPages} · 25/page</span>
        <div className="flex gap-2">
          {query.page > 1 ? <Link className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-link"
            href={collegeMappingHref("FACULTY_ASSIGNMENTS", { ...query, page: query.page - 1 })}>Previous</Link> : null}
          {query.page < totalPages ? <Link className="rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-link"
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
