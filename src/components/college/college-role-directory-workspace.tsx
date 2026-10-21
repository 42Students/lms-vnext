import { Select } from "@/components/ui/select";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { AuthorizationError } from "@/modules/permissions/policy";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { StudentClassMoveAction } from "@/components/college/student-class-move-action";
import { CollegeFacultyLifecycleAction } from "@/components/college/college-faculty-lifecycle-action";
import { CollegePersonEditAction } from "@/components/college/college-person-edit-action";
import {CollegePersonAuditModal} from "@/components/college/college-person-audit-modal";
import {CollegePersonProfileOverviewModal} from "@/components/college/college-person-profile-overview-modal";
import {CollegeStudentImportHistory} from "@/components/college/college-student-import-history";
import { CollegeStudentLifecycleAction } from "@/components/college/college-student-lifecycle-action";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import {
  collegeRoleDirectoryHref,
  collegeRoleDirectoryFilterMessage,
  collegeRoleDirectoryHasActiveFilters,
  collegeRoleDirectoryPageRange,
  collegeRoleDirectoryQuerySchema,
  describeCollegeDirectoryContext,
  collegeDirectorySearchHint,
  parseCollegeRoleDirectorySearchParams,
  assertCompatibleCollegeRoleDirectoryFilters,
  canonicalCollegeRoleDirectoryHref,
  selectedDirectoryValueNotListed,
  collegeRoleContactHref,
  type CollegeDirectoryKind,
} from "@/modules/people/college-role-directory-model";
import { listCollegeRoleDirectory } from "@/modules/people/college-role-directory-service";
import { collegeRoleDirectoryExportHref } from "@/modules/people/college-role-directory-export";
import {collegeLearnerVerificationHref} from "@/modules/verification/admin-links";

type RawSearch = Record<string, string | string[] | undefined>;

function joinedLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export async function CollegeRoleDirectoryWorkspace({
  kind,
  searchParams,
}: {
  kind: CollegeDirectoryKind;
  searchParams: Promise<RawSearch>;
}) {
  const title = kind === "FACULTY" ? "Faculty" : "Students";
  const path = kind === "FACULTY" ? "/college/faculty" : "/college/students";
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");

  let filter: ReturnType<typeof parseCollegeRoleDirectorySearchParams>;
  try {
    filter = parseCollegeRoleDirectorySearchParams(await searchParams);
    assertCompatibleCollegeRoleDirectoryFilters(kind,filter);
  } catch (error) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader title={title} />
        <ErrorState
          title="Invalid directory filters"
          description={collegeRoleDirectoryFilterMessage(error)}
          action={<Link href={path} className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear directory filters</Link>}
        />
      </div>
    );
  }

  let result: Awaited<ReturnType<typeof listCollegeRoleDirectory>>;
  try {
    result = await listCollegeRoleDirectory(context, kind, filter);
  } catch (error) {
    // A forbidden college scope must remain forbidden; retry is only for
    // transient directory errors, never an authorization fallback.
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-6">
      <PageHeader title={title}/>
      <ErrorState title={"Could not load "+title.toLowerCase()}
        description={"The "+title.toLowerCase()+" directory is temporarily unavailable. No changes were made."}
        action={<Link href={collegeRoleDirectoryHref(kind,filter)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>} />
    </div>;
  }
  const canonical = canonicalCollegeRoleDirectoryHref(kind, result.filter, result.totalPages);
  if (canonical) redirect(canonical);
  type Row = (typeof result.items)[number];
  const effectiveStatus = (item: Row) =>
    item.membershipStatus === "ENDED" ? "Ended" :
    item.membershipStatus !== "ACTIVE" || item.userStatus !== "ACTIVE" ? "Suspended" : "Active";
  const actions = (item: Row) => <div className="flex min-w-0 flex-wrap items-center gap-2">
    <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
    <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
    <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
      departments={kind==="FACULTY"?result.departmentOptions:[]}/>
    {kind==="FACULTY" ? <CollegeFacultyLifecycleAction
      membershipId={item.membershipId} name={item.name} status={item.membershipStatus}/>
    : <CollegeStudentLifecycleAction membershipId={item.membershipId}
      name={item.name} status={item.membershipStatus}/>}
  </div>;
  // Legacy student order: Name, Roll No., Mobile, Email, Class, Gender,
  // Status, Actions. Sensitive contact/gender and roll are not present in the
  // college-scoped list read model; link to authorized detail instead of
  // inventing PII or querying another tenant's identity.
  const studentColumns: DataTableColumn<Row>[] = [
    {key:"name",header:"Name",mobilePriority:"primary",cell:item=>
      <Link href={"/college/students/"+item.membershipId}
        className="font-semibold text-link underline underline-offset-4">{item.name}</Link>},
    {key:"roll",header:"Roll No.",cell:item=>
      <Link href={"/college/students/"+item.membershipId} className="text-link underline">View student record</Link>},
    {key:"mobile",header:"Mobile",cell:item=>
      <Link href={collegeRoleContactHref(item.membershipId)}
        className="text-link underline">View contact card</Link>},
    {key:"email",header:"Email",cell:item=>item.email??"Not recorded"},
    {key:"class",header:"Class",cell:item=>item.sections.length?
      [...new Set(item.sections)].join(", "):"Not assigned"},
    {key:"gender",header:"Gender",cell:()=>"Not in directory"},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><>
      <StatusBadge tone={effectiveStatus(item)==="Active"?"success":"warning"}>
        {effectiveStatus(item)}
      </StatusBadge>
      {item.userStatus!=="ACTIVE"?<p className="mt-1 text-xs text-warning">Account: {item.userStatus}</p>:null}
    </>},
    {key:"actions",header:"Actions",cell:actions},
  ];
  return (
    <div className="min-w-0 space-y-6 md:space-y-6">
      <PageHeader
        title={title}
        description={
          kind === "FACULTY"
            ? "Manage faculty accounts, teaching information and membership status."
            : "Find students by program, batch, class and account status."
        }
        actions={kind === "FACULTY" ? (
          <PersonOnboardDialog collegeId={context.membership.collegeId} forcedRole="FACULTY" />
        ) : (
          <Link href="/college/students/register"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-primary)] px-4 text-sm font-[650] text-white hover:bg-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Register students
          </Link>
        )}
      />

      {kind === "LEARNER" ? <nav aria-label="Student directory tools"
        className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3 text-sm">
        <Link href="/college/students/import"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Import CSV</Link>
        <CollegeStudentImportHistory />
        <details className="min-w-0">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">CSV exports</summary>
          <div className="flex min-w-0 flex-col gap-2 border-t border-border py-2">
            <Link href={"/api/college/roles/export-visible?kind="+kind+"&"+
              new URL(collegeRoleDirectoryExportHref(kind,result.filter),"https://lms.invalid").searchParams.toString()}
              className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export visible students.csv</Link>
            <Link href={collegeRoleDirectoryExportHref(kind,result.filter)}
              className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export Learner CSV (max 1,000)</Link>
          </div>
        </details>
        <Link href="/college/people"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">People Directory</Link>
      </nav> : null}
      {kind === "FACULTY" ? <nav aria-label="Faculty directory tools" className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3 text-sm">
        <Link href="/college/faculty/import" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Import faculty CSV</Link>
        <details className="min-w-0">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export Faculty CSV (max 1,000)</summary>
          <div className="flex min-w-0 flex-col gap-2 border-t border-border py-2">
            <Link href={"/api/college/roles/export-visible?kind="+kind+"&"+
              new URL(collegeRoleDirectoryExportHref(kind,result.filter),"https://lms.invalid").searchParams.toString()}
              className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export visible faculty.csv</Link>
            <Link href={collegeRoleDirectoryExportHref(kind,result.filter)}
              className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export Faculty CSV (max 1,000)</Link>
          </div>
        </details>
        <Link href="/college/people" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">People Directory</Link>
      </nav> : null}
      <section aria-label={title+" directory summary"} className="grid min-w-0 grid-cols-2 gap-3 border-y border-border py-3 md:grid-cols-3">
        {[
          [title,result.metrics.registered],
          ["Active",result.metrics.active],
          ["Suspended",result.metrics.suspended],
        ].map(([label,value])=><StatTile key={label} variant="college" label={String(label)} value={value}/>)}
        <p className="col-span-full text-xs text-muted-foreground leading-[20px]">Visible now: <span className="font-semibold">Not tracked</span>. Do not infer presence from login or membership status.</p>
      </section>
      <section className="min-w-0 border-t border-border pt-4" aria-label={title + " directory filters"}>
        <form method="get" action={path} className="grid min-w-0 grid-cols-1 items-end gap-3 md:grid-cols-2 min-[992px]:grid-cols-4">
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            {collegeDirectorySearchHint(kind)}
            <Input className="min-h-11 w-full min-w-0 md:min-h-9"
              type="search"
              name="q"
              maxLength={100}
              defaultValue={result.filter.q}
              placeholder="Search this college"
              
            />
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Membership status
            <Select className="min-h-11 w-full min-w-0 md:min-h-9"
              name="status"
              defaultValue={result.filter.status}
              
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ENDED">Ended</option>
            </Select>
          </label>
          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Active class / section
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="sectionId" defaultValue={result.filter.sectionId??""} >
              <option value="">All classes</option>
              {selectedDirectoryValueNotListed(result.filter.sectionId,result.sectionOptions.map(row=>row.id)) ?
                <option value={result.filter.sectionId}>Selected class (outside first 200)</option> : null}
              {result.sectionOptions.map(row=><option key={row.id} value={row.id}>{row.batchName} · {row.name}</option>)}
            </Select>
            {result.sectionOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 classes shown.</span> : null}
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Active program
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="programId" defaultValue={result.filter.programId??""} >
              <option value="">All programs</option>
              {selectedDirectoryValueNotListed(result.filter.programId,result.programOptions.map(row=>row.id)) ?
                <option value={result.filter.programId}>Selected program (outside first 200)</option> : null}
              {result.programOptions.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
            {result.programOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 programs shown.</span> : null}
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Active batch
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="cohortId" defaultValue={result.filter.cohortId ?? ""}
              >
              <option value="">All batches</option>
              {selectedDirectoryValueNotListed(result.filter.cohortId,result.cohortOptions.map(c=>c.id)) ?
                <option value={result.filter.cohortId}>Selected batch (outside first 200)</option> : null}
              {result.cohortOptions.map(cohort=><option key={cohort.id} value={cohort.id}>
                {cohort.programName} · {cohort.name}
              </option>)}
            </Select>
            {result.cohortOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 200 batches shown; search by name for others.
            </span> : null}
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Department
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="facultyDepartmentId" defaultValue={result.filter.facultyDepartmentId ?? ""}
              >
              <option value="">All departments</option>
              {selectedDirectoryValueNotListed(result.filter.facultyDepartmentId,result.departmentOptions.map(d=>d.id)) ?
                <option value={result.filter.facultyDepartmentId}>Selected department (outside first 200)</option> : null}
              {result.departmentOptions.map(dept=><option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </Select>
            {result.departmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              Only first 200 departments shown; use name search for others.
            </span> : null}
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Employment type
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="employmentType" defaultValue={result.filter.employmentType ?? ""}
              >
              <option value="">All employment types</option>
              {selectedDirectoryValueNotListed(result.filter.employmentType,result.employmentOptions) ?
                <option value={result.filter.employmentType}>Selected type (outside first 100)</option> : null}
              {result.employmentOptions.map(value=><option key={value} value={value}>{value}</option>)}
            </Select>
            {result.employmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 100 distinct types shown.
            </span> : null}
          </label> : null}
          <Disclosure title="Advanced filters" className="min-w-0 md:col-span-2 min-[992px]:col-span-4" defaultOpen={collegeRoleDirectoryHasActiveFilters(kind,result.filter)}>
            <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Platform account
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="accountStatus" defaultValue={result.filter.accountStatus}
              >
              <option value="ALL">All accounts</option>
              <option value="ACTIVE">Active accounts</option>
              <option value="DISABLED">Disabled accounts</option>
            </Select>
          </label>
          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Active enrollment
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="enrollment" defaultValue={result.filter.enrollment}
              >
              <option value="ALL">All learners</option>
              <option value="ACTIVE">Has active program enrollment</option>
              <option value="NONE">No active program enrollment</option>
            </Select>
          </label> : null}



          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Roll number coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="rollPresence" defaultValue={result.filter.rollPresence}
              >
              <option value="ALL">All learners</option>
              <option value="PRESENT">Roll recorded</option>
              <option value="MISSING">Roll missing</option>
            </Select>
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Registration number coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="registrationPresence" defaultValue={result.filter.registrationPresence}
              >
              <option value="ALL">All learners</option>
              <option value="PRESENT">Registration recorded</option>
              <option value="MISSING">Registration missing</option>
            </Select>
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Active class placement
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="classPresence" defaultValue={result.filter.classPresence}
              >
              <option value="ALL">All learners</option>
              <option value="ASSIGNED">Has active class</option>
              <option value="NONE">No active class</option>
            </Select>
          </label> : null}


          {kind === "FACULTY" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Academic title coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="titlePresence" defaultValue={result.filter.titlePresence}
              >
              <option value="ALL">All faculty</option>
              <option value="PRESENT">Title recorded</option>
              <option value="MISSING">Title missing</option>
            </Select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Primary department coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="departmentPresence" defaultValue={result.filter.departmentPresence}
              >
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Department recorded</option>
              <option value="MISSING">Department missing</option>
            </Select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Course teaching
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="teaching" defaultValue={result.filter.teaching}
              >
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Has active teaching</option>
              <option value="NONE">No active teaching</option>
            </Select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Active course teaching role
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="teachingRole" defaultValue={result.filter.teachingRole}
              >
              <option value="ALL">Any role</option>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-Teacher</option>
              <option value="TA">Teaching Assistant</option>
            </Select>
          </label> : null}
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Joined from (IST)
            <Input className="min-h-11 w-full min-w-0 md:min-h-9" type="date" name="joinedFrom" defaultValue={result.filter.joinedFrom??""}  />
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Joined through (IST)
            <Input className="min-h-11 w-full min-w-0 md:min-h-9" type="date" name="joinedThrough" defaultValue={result.filter.joinedThrough??""}  />
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Order
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="sort" defaultValue={result.filter.sort}
              >
              <option value="NAME">Name A–Z</option>
              <option value="NAME_DESC">Name Z–A</option>
              <option value="NEWEST">Newest membership</option>
              <option value="OLDEST">Oldest membership</option>
            </Select>
          </label>
          <label className="grid min-w-0 gap-2 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Rows per page
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="pageSize" defaultValue={result.filter.pageSize} >
              <option value="10">10</option><option value="25">25</option><option value="50">50</option>
            </Select>
          </label>
            </div>
          </Disclosure>
          <Button variant="primary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">
            Apply
          </Button>
          <Link href={path} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Clear
          </Link>
        </form>
      </section>

      <section aria-label={title + " results"} className="min-w-0">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground leading-[22px]">
          {result.total} matching {kind === "FACULTY" ? "faculty" : "learner"} membership{result.total === 1 ? "" : "s"}
        </p>
        {result.items.length === 0 ? (
          <EmptyState title="No matching memberships"
            description={result.total===0
              ? collegeRoleDirectoryHasActiveFilters(kind,result.filter)?"No memberships match these directory filters.":"No role memberships are recorded in this college."
              : "There are no records on this page. Select an earlier page."}
            action={collegeRoleDirectoryHasActiveFilters(kind,result.filter)?
              <Link href={path} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear roster filters</Link>:undefined}/>
        ) : (
          <>
          <ul aria-label={title + " mobile records"} className="space-y-2 md:hidden">
            {result.items.map(item=>(
              <li key={item.membershipId} className="min-w-0 space-y-2 border-b border-border py-3">
                <div className="min-w-0">
                  <Link href={kind==="LEARNER"?"/college/students/"+item.membershipId:"/college/faculty/"+item.membershipId}
                    className="break-words font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{item.name}</Link>
                  <p className="mt-1 break-all text-xs text-muted-foreground leading-[20px]">{item.email??"No email recorded"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={effectiveStatus(item)==="Active"?"success":"warning"}>
                    {effectiveStatus(item)}
                  </StatusBadge>
                  {item.userStatus!=="ACTIVE"?<span className="text-xs text-warning">Account: {item.userStatus}</span>:null}
                </div>
                <p className="break-words text-sm text-body leading-[22px]">{describeCollegeDirectoryContext(kind,item)}</p>
                <p className="text-xs text-muted-foreground leading-[20px]">Joined {joinedLabel(item.joinedAt)} IST</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link href={collegeRoleContactHref(item.membershipId)}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View contact card</Link>
                  {kind==="LEARNER"?<Link href={collegeLearnerVerificationHref(item.membershipId)}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Profile verification</Link>:null}
                </div>
                {kind==="LEARNER"&&item.membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE"&&item.cohort!==null?
                  <StudentClassMoveAction membershipId={item.membershipId} name={item.name}/>:null}
                <details className="min-w-0"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">More actions</summary><div className="flex min-w-0 flex-col items-start gap-2 pb-2">
                <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
                  departments={kind==="FACULTY"?result.departmentOptions:[]}/>
                {kind==="FACULTY"?<CollegeFacultyLifecycleAction membershipId={item.membershipId}
                  name={item.name} status={item.membershipStatus}/>:null}
                {kind==="LEARNER"?<CollegeStudentLifecycleAction membershipId={item.membershipId}
                  name={item.name} status={item.membershipStatus}/>:null}
                </div></details>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <DataTable
              caption={title+" directory"}
              rows={result.items}
              getRowKey={item=>item.membershipId}
              empty={<EmptyState title="No role memberships" description="No role memberships match the selected filters."/>}
              columns={kind === "LEARNER" ? studentColumns : [
                {key:"person",header:"Person",mobilePriority:"primary",cell:item=><>
                  <Link href={kind==="LEARNER"?"/college/students/"+item.membershipId:"/college/faculty/"+item.membershipId}
                    className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground leading-[20px]">{item.email??"No email recorded"}</p>
                  <Link href={collegeRoleContactHref(item.membershipId)}
                    className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                    View contact card
                  </Link>
                  {kind==="LEARNER"?<Link href={collegeLearnerVerificationHref(item.membershipId)}
                    className="ml-3 inline-flex min-h-11 items-center text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                    Profile verification
                  </Link>:null}
                </>},
                {key:"membership",header:"Membership",mobilePriority:"secondary",cell:item=><>
                  <StatusBadge tone={effectiveStatus(item)==="Active"?"success":"warning"}>
                    {effectiveStatus(item)}
                  </StatusBadge>
                  {item.userStatus!=="ACTIVE"?<p className="mt-1 text-xs text-warning leading-[20px]">
                    Platform account: {item.userStatus}
                  </p>:null}
                </>},
                {key:"context",header:kind==="FACULTY"?"Teaching assignments":"Program · Batch · Class",
                  mobilePriority:"secondary",cell:item=><>
                    {describeCollegeDirectoryContext(kind,item)}
                    {kind==="LEARNER"&&item.membershipStatus==="ACTIVE"&&
                      item.userStatus==="ACTIVE"&&item.cohort!==null?
                      <div className="mt-2">
                        <StudentClassMoveAction membershipId={item.membershipId} name={item.name}/>
                      </div>:null}
                    <Disclosure title="More actions" className="mt-2 min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 pb-2">
                        <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                        <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                        <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
                          departments={kind==="FACULTY"?result.departmentOptions:[]}/>
                        {kind==="FACULTY"
                          ? <CollegeFacultyLifecycleAction membershipId={item.membershipId} name={item.name} status={item.membershipStatus}/>
                          : <CollegeStudentLifecycleAction membershipId={item.membershipId} name={item.name} status={item.membershipStatus}/>}
                      </div>
                    </Disclosure>
                </>},
                {key:"joined",header:"Joined",mobilePriority:"secondary",cell:item=>joinedLabel(item.joinedAt)},
              ]}
            />
          </div>
          </>
        )}
      </section>

      <nav aria-label={title + " pagination"} className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground leading-[22px]">
          Page {result.filter.page.toLocaleString("en-IN")} of {result.totalPages.toLocaleString("en-IN")} · Showing {collegeRoleDirectoryPageRange(result.filter.page,result.pageSize,result.total).first.toLocaleString("en-IN")}–{collegeRoleDirectoryPageRange(result.filter.page,result.pageSize,result.total).last.toLocaleString("en-IN")} of {result.total.toLocaleString("en-IN")} memberships
        </p>
        <div className="flex gap-2">
          {result.filter.page > 1 ? (
            <Link
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page - 1 })}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[14px] font-semibold leading-[42px] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:min-w-9 md:rounded-[var(--lms-control-radius)] md:leading-5"
            >
              Previous
            </Link>
          ) : null}
          {result.filter.page < result.totalPages ? (
            <Link
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page + 1 })}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[14px] font-semibold leading-[42px] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:min-w-9 md:rounded-[var(--lms-control-radius)] md:leading-5"
            >
              Next
            </Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs text-muted-foreground leading-[20px]">
        CSV applies the same roster filters as this view, not just name and status.
        Export includes only current-college role memberships, rechecks College Admin access and is capped at 1,000 rows.
      </p>
      <p className="text-xs text-muted-foreground leading-[20px]">
        Directory records are scoped to this college.
        {kind === "LEARNER" ? " Roll numbers and sensitive contact/gender fields require the authorized student detail or contact card; they are not returned in this directory list. Account-wide suspension and membership suspension are distinct. Hard deletion and OTP unlock are not available here." : ""}
        {kind === "FACULTY"
          ? " Counts are active teaching assignments, not a complete workload or schedule."
          : " Only active academic enrollments and classes are shown; absent associations are not inferred."}
        Creation, import, editing, profile details and lifecycle actions remain in their existing workspaces.
      </p>
    </div>
  );
}
