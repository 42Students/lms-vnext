import Link from "next/link";
import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import {
  CollegeFacultyAssignmentCreate,
  CollegeFacultyAssignmentEnd,
} from "@/components/college/college-faculty-assignment-actions";
import { listCollegeTeachingOptions } from "@/modules/courses/college-teaching-options-service";
import { CollegeFacultyReassignAction } from "@/components/college/college-faculty-reassign-action";
import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { facultyAssignmentQuerySchema, collegeMappingHref } from "@/modules/academics/college-mapping-model";
import { listCollegeFacultyAssignments } from "@/modules/academics/college-mapping-service";
import { facultyAssignmentCsvHref } from "@/modules/academics/college-faculty-assignment-export-model";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollegeFacultyAssignmentPage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Faculty Assignment"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator to assign your College Admin membership before editing faculty assignments."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
  </div>;
  const raw = await searchParams;
  const parsed = facultyAssignmentQuerySchema.safeParse(
    Object.fromEntries(Object.entries({
      q: first(raw.q), status: first(raw.status), role: first(raw.role), page: first(raw.page),
      courseCode: first(raw.courseCode), sectionCode: first(raw.sectionCode),
    }).filter(([, value]) => value !== undefined && value !== "")),
  );
  if (!parsed.success) return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Faculty Assignment" />
      <ErrorState title="Invalid assignment filters"
        description="The status, page or search is invalid; no assignments were loaded."
        action={<Link href="/college/faculty-assignment"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:text-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>} />
    </div>
  );

  const [directory, options] = await Promise.all([
    listCollegeFacultyAssignments(context, parsed.data),
    listCollegeTeachingOptions(context),
  ]);
  const { query, items, total, totalPages } = directory;
  // Legacy overview metrics are scoped independently from roster filters.
  // A failed summary may not take down an otherwise usable assignment list.
  const overviewQuery={q:"",role:"ALL" as const,status:"ALL" as const,page:1};
  const metricReads=await Promise.allSettled([
   listCollegeFacultyAssignments(context,overviewQuery),
   listCollegeFacultyAssignments(context,{...overviewQuery,status:"ACTIVE"}),
   listCollegeFacultyAssignments(context,{...overviewQuery,status:"ACTIVE",role:"PRIMARY"}),
  ]);
  const metricValue=(index:number)=>metricReads[index]?.status==="fulfilled"
   ?metricReads[index].value.total:null;
  const currentVisibleClasses=new Set(items.filter(item=>item.state==="ACTIVE")
   .map(item=>item.cohortName+"|"+item.sectionName+"|"+item.periodName)).size;
  const classChoices=Array.from(
    new Map(options.deliveries.map(item=>[item.sectionCode,{code:item.sectionCode,name:item.sectionName}])).values(),
  ).sort((a,b)=>a.name.localeCompare(b.name)||a.code.localeCompare(b.code));
  // This optional list shows active courses only; historical assignments
  // must not be assigned a fabricated semester from today's cohort state.
  const currentDeliveryById=new Map(options.deliveries.map(item=>[item.id,item]));
  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
      <PageHeader
        title={FACULTY_ASSIGNMENT_COPY.title}
        description={FACULTY_ASSIGNMENT_COPY.description}
        actions={<Link href="/college/faculty"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Faculty directory</Link>}
      />
      <section aria-label="Teaching assignments overview" className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface lg:grid-cols-4 lg:divide-y-0">
       {([
        ["Assignments",metricValue(0),""],
        ["Active",metricValue(1),""],
        ["Primary instructors",metricValue(2),""],
        ["Classes covered",currentVisibleClasses,"Visible page only"],
       ] as const).map(([label,value,note])=><article key={label} className="min-w-0 p-[var(--lms-space-4)]">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <strong className="mt-2 block text-2xl font-semibold tabular-nums text-[var(--lms-heading)]">{value===null?"—":value.toLocaleString("en-IN")}</strong>
        {note?<p className="mt-1 text-xs text-muted-foreground">{note}</p>:null}
       </article>)}
      </section>
      <Disclosure title={FACULTY_ASSIGNMENT_COPY.createTitle} className="min-w-0 border-y border-[var(--lms-canvas-border)]" contentClassName="pb-[var(--lms-space-4)] pt-[var(--lms-space-3)]">
        <CollegeFacultyAssignmentCreate {...options} />
      </Disclosure>
      <Link prefetch={false} download href={facultyAssignmentCsvHref(query)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">
        Export filtered faculty assignments CSV
      </Link>
      <FilterBar title="Filters" activeCount={Number(Boolean(query.q)) + Number(Boolean(query.courseCode)) + Number(Boolean(query.sectionCode)) + Number(query.status !== "ACTIVE") + Number(query.role !== "ALL")}
        search={<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Faculty, course or class
          <Input name="q" type="search" form="college-faculty-assignment-filters"
            defaultValue={query.q} maxLength={100} className="min-h-11 min-w-0 md:min-h-9"/>
        </label>}
        action={<Button type="submit" form="college-faculty-assignment-filters" className="min-h-11 md:min-h-9">Filter</Button>}>
        <form id="college-faculty-assignment-filters" action="/college/faculty-assignment" method="get"
          className="grid min-w-0 items-end gap-[8px] md:grid-cols-2 xl:grid-cols-4">
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Exact course code
            <Input name="courseCode" defaultValue={query.courseCode ?? ""} maxLength={64}/>
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Class
            <Input name="sectionCode" list="college-faculty-class-codes"
              defaultValue={query.sectionCode??""} placeholder="All classes (enter exact class code)" maxLength={64}/>
            <datalist id="college-faculty-class-codes">
              {classChoices.map(item=><option key={item.code} value={item.code} label={item.name}/>)}
            </datalist>
            {options.deliveriesTruncated?<span className="text-xs font-normal text-muted-foreground">
              First 200 active deliveries shown; a selected class outside this list is retained.
            </span>:null}
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Assignment lifecycle
            <Select name="status" defaultValue={query.status}>
              <option value="ACTIVE">Active</option><option value="ENDED">Ended</option><option value="ALL">All</option>
            </Select>
          </label>
          <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {FACULTY_ASSIGNMENT_COPY.roleLabel}
            <Select name="role" defaultValue={query.role}>
              <option value="ALL">All roles</option>
              <option value="PRIMARY">{FACULTY_ASSIGNMENT_ROLE_LABELS.PRIMARY}</option>
              <option value="CO_TEACHER">{FACULTY_ASSIGNMENT_ROLE_LABELS.CO_TEACHER}</option>
              <option value="TA">{FACULTY_ASSIGNMENT_ROLE_LABELS.TA}</option>
            </Select>
          </label>
          <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap xl:col-span-4">
            <Button type="submit" className="min-h-11 w-full md:hidden">Filter</Button>
            <Link href="/college/faculty-assignment"
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear</Link>
          </div>
        </form>
      </FilterBar>
      <section className="min-w-0" aria-label="Teaching assignment roster">
        <h2 className="mb-2 text-lg font-semibold text-[var(--lms-heading)]">Current teaching assignments</h2>
        <p className="border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-sm text-muted-foreground">
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
                    className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                    {item.courseName}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.courseCode}</p>
                </> },
              { key: "class", header: FACULTY_ASSIGNMENT_COPY.columns.class,
                mobilePriority: "secondary", cell: item => item.cohortName + " · " + item.sectionName },
              { key: "semester", header: "Semester", mobilePriority: "secondary",
                cell: item => {
                  const current=currentDeliveryById.get(item.deliveryId);
                  return current?.semesterNumber==null?"Not recorded":
                    "Semester "+current.semesterNumber+" (current)";
                } },
              { key: "year", header: "Year", mobilePriority: "secondary",
                cell: item => item.periodName||"Not recorded" },
              { key: "role", header: FACULTY_ASSIGNMENT_COPY.columns.role,
                mobilePriority: "secondary", cell: item => <StatusBadge tone={item.role==="PRIMARY"?"success":item.role==="CO_TEACHER"?"info":"warning"}>{facultyAssignmentRoleLabel(item.role)}</StatusBadge> },
              { key: "active", header: FACULTY_ASSIGNMENT_COPY.columns.active,
                mobilePriority: "secondary", cell: item => <StatusBadge tone={item.state==="ACTIVE"?"success":"error"}>{item.state === "ACTIVE" ? FACULTY_ASSIGNMENT_COPY.yes : FACULTY_ASSIGNMENT_COPY.no}</StatusBadge> },
              { key: "actions", header: FACULTY_ASSIGNMENT_COPY.columns.actions,
                mobilePriority: "action", cell: item => item.state === "ACTIVE" ? (
                  <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
                    <CollegeFacultyAssignmentEnd
                      assignmentId={item.id} facultyName={item.facultyName}
                      courseName={item.courseName} role={item.role}
                    />
                    <CollegeFacultyReassignAction
                      assignmentId={item.id} facultyName={item.facultyName}
                      role={item.role} oldMembershipId={item.membershipId}
                      expectedUpdatedAt={item.updatedAt.toISOString()}
                      faculty={options.faculty}
                      deliveryId={item.deliveryId} deliveries={options.deliveries}
                    />
                  </div>
                ) : <span className="text-xs text-muted-foreground">Historical</span> },
            ]}
          />
        )}
      </section>
      <nav aria-label="Faculty assignment pagination" className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)] text-sm">
        <span className="text-muted-foreground">{total===0?0:(query.page-1)*25+1}-{Math.min(total,query.page*25)} of {total} · Page {query.page} of {totalPages} · 25/page</span>
        <div className="flex gap-2">
          {query.page > 1 ? <Link className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            href={collegeMappingHref("FACULTY_ASSIGNMENTS", { ...query, page: query.page - 1 })}>Previous</Link> : null}
          {query.page < totalPages ? <Link className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            href={collegeMappingHref("FACULTY_ASSIGNMENTS", { ...query, page: query.page + 1 })}>Next</Link> : null}
        </div>
      </nav>
      <p className="text-xs text-muted-foreground">
        Assignment changes require confirmation and produce audit records. A second primary teacher
        or an already assigned faculty member cannot be added to the same live delivery.
        Create supports several courses for one faculty; Reassign changes the faculty,
        while End deactivates without deleting the audit history. Course, class, semester,
        year and role changes require a new verified delivery or a separate authorized edit.
        The Year column is the recorded academic-period name; the Semester display,
        when available, is the current cohort term, not a historical assignment snapshot.
        Class scheduling and automatic reassignment remain offering-level workflows.
      </p>
    </div>
  );
}
