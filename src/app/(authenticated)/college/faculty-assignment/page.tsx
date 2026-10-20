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
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { facultyAssignmentQuerySchema, collegeMappingHref } from "@/modules/academics/college-mapping-model";
import { listCollegeFacultyAssignments } from "@/modules/academics/college-mapping-service";
import { facultyAssignmentCsvHref } from "@/modules/academics/college-faculty-assignment-export-model";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

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
    <div className="min-w-0 space-y-[16px]">
      <PageHeader title="Faculty Assignment" />
      <ErrorState title="Invalid assignment filters"
        description="The status, page or search is invalid; no assignments were loaded."
        action={<Link href="/college/faculty-assignment"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link>} />
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
    <div className="min-w-0 max-w-full space-y-[16px]">
      <PageHeader
        title={FACULTY_ASSIGNMENT_COPY.title}
        description={FACULTY_ASSIGNMENT_COPY.description}
        actions={<Link href="/college/faculty"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Faculty directory</Link>}
      />
      <Link prefetch={false} download href={facultyAssignmentCsvHref(query)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
        Export filtered faculty assignments CSV
      </Link>
      <CollegeFacultyAssignmentCreate {...options} />
      <section className="border-b border-border pb-4">
        <form action="/college/faculty-assignment" method="get" className="flex flex-wrap items-end gap-[8px]">
          <label className="grid min-w-0 md:min-w-[220px] flex-1 gap-1 text-sm font-semibold text-body">
            Faculty, course or class
            <Input name="q" type="search" defaultValue={query.q} maxLength={100}
              />
          </label>
          <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold text-body">
            Exact course code
            <Input name="courseCode" defaultValue={query.courseCode ?? ""} maxLength={64}
              />
          </label>
          <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold text-body">
            Class
            <Select name="sectionCode" defaultValue={query.sectionCode ?? ""}
              >
              <option value="">All classes</option>
              {query.sectionCode&&!classChoices.some(item=>item.code===query.sectionCode)?
                <option value={query.sectionCode}>Selected class ({query.sectionCode})</option>:null}
              {classChoices.map(item=><option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}
            </Select>
            {options.deliveriesTruncated?<span className="text-xs font-normal text-muted-foreground">
              First 200 active deliveries shown; a selected class outside this list is retained.
            </span>:null}
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Assignment lifecycle
            <Select name="status" defaultValue={query.status}
              >
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
              <option value="ALL">All</option>
            </Select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            {FACULTY_ASSIGNMENT_COPY.roleLabel}
            <Select name="role" defaultValue={query.role}
              >
              <option value="ALL">All roles</option>
              <option value="PRIMARY">{FACULTY_ASSIGNMENT_ROLE_LABELS.PRIMARY}</option>
              <option value="CO_TEACHER">{FACULTY_ASSIGNMENT_ROLE_LABELS.CO_TEACHER}</option>
              <option value="TA">{FACULTY_ASSIGNMENT_ROLE_LABELS.TA}</option>
            </Select>
          </label>
          <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
          <Link href="/college/faculty-assignment"
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear</Link>
        </form>
      </section>
      <section className="min-w-0" aria-label="Teaching assignment roster">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {total} matching teaching assignment{total === 1 ? "" : "s"}
        </p>
        {items.length === 0 ? (
          <EmptyState title={total===0?"No matching assignments":"No assignments on this page"}
            description={total===0?"No persisted teaching assignments match these filters. Unassigned faculty are listed separately in the Faculty directory.":"No assignments on this page. Choose an earlier page."}/>
        ) : (
          <DataTable
            caption="Teaching assignment roster"
            rows={items}
            getRowKey={item => item.id}
            empty={<EmptyState title="No matching assignments" description="No persisted teaching assignments match these filters. Unassigned faculty are listed separately in the Faculty directory."/>}
            columns={[
              { key: "faculty", header: FACULTY_ASSIGNMENT_COPY.columns.faculty,
                mobilePriority: "primary", cell: item => item.facultyName },
              { key: "course", header: FACULTY_ASSIGNMENT_COPY.columns.course,
                mobilePriority: "secondary", cell: item => <>
                  <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">
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
                mobilePriority: "secondary", cell: item => <StatusBadge tone={item.state==="ACTIVE"?"success":"neutral"}>{item.state === "ACTIVE" ? FACULTY_ASSIGNMENT_COPY.yes : FACULTY_ASSIGNMENT_COPY.no}</StatusBadge> },
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
      <nav aria-label="Faculty assignment pagination" className="flex flex-wrap items-center justify-between gap-[8px] text-sm">
        <span className="text-muted-foreground">Page {query.page} of {totalPages} · 25/page</span>
        <div className="flex gap-2">
          {query.page > 1 ? <Link className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9"
            href={collegeMappingHref("FACULTY_ASSIGNMENTS", { ...query, page: query.page - 1 })}>Previous</Link> : null}
          {query.page < totalPages ? <Link className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9"
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
