import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable } from "@/components/ui/data-table";
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
      <div className="space-y-5">
        <PageHeader eyebrow="College Admin · People" title={title} />
        <ErrorState
          title="Invalid directory filters"
          description={collegeRoleDirectoryFilterMessage(error)}
          action={<Link href={path} className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear directory filters</Link>}
        />
      </div>
    );
  }

  const result = await listCollegeRoleDirectory(context, kind, filter);
  const canonical = canonicalCollegeRoleDirectoryHref(kind, result.filter, result.totalPages);
  if (canonical) redirect(canonical);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · People"
        title={title}
        description={
          kind === "FACULTY"
            ? "Manage faculty accounts, teaching information and membership status."
            : "Find students by program, batch, class and account status."
        }
        actions={
          <>
            {kind === "FACULTY" ? (
              <PersonOnboardDialog collegeId={context.membership.collegeId} forcedRole="FACULTY" />
            ) : null}
            {kind === "FACULTY" ? (
              <Link href="/college/faculty/import"
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Import faculty CSV
              </Link>
            ) : null}
            {kind === "LEARNER" ? (
              <Link href="/college/students/register"
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Register students
              </Link>
            ) : null}
            {kind==="LEARNER"?<CollegeStudentImportHistory/>:null}
            {kind === "LEARNER" ? (
              <Link href="/college/students/import"
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Import CSV
              </Link>
            ) : null}
            <Link href={"/api/college/roles/export-visible?kind="+kind+"&"+
              new URL(collegeRoleDirectoryExportHref(kind,result.filter),"https://lms.invalid").searchParams.toString()}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Export visible {kind==="FACULTY"?"faculty.csv":"students.csv"}
            </Link>
            <Link href={collegeRoleDirectoryExportHref(kind,result.filter)}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Export {kind === "FACULTY" ? "Faculty" : "Learner"} CSV (max 1,000)
            </Link>
            <Link href="/college/people"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              People directory
            </Link>
          </>
        }
      />

      <section aria-label={title+" directory summary"} className="grid gap-3 sm:grid-cols-4">
        {[
          [title,result.metrics.registered],
          ["Active",result.metrics.active],
          ["Suspended",result.metrics.suspended],
        ].map(([label,value])=><div key={label} className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
          <p className="text-xs font-semibold text-body">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
        </div>)}
        <div className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
          <p className="text-xs font-semibold text-body">Visible now</p>
          <p className="mt-1 text-sm font-semibold text-body">Not tracked</p>
          <p className="mt-1 text-xs text-muted-foreground">Do not infer presence from login or membership status.</p>
        </div>
      </section>
      <section className="border-t border-border pt-4" aria-label={title + " directory filters"}>
        <form method="get" action={path} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-48 flex-1 gap-2 text-sm font-semibold text-body">
            {collegeDirectorySearchHint(kind)}
            <Input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={result.filter.q}
              placeholder="Search this college"
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm"
            />
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Membership status
            <Select
              name="status"
              defaultValue={result.filter.status}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ENDED">Ended</option>
            </Select>
          </label>
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active class / section
            <Select name="sectionId" defaultValue={result.filter.sectionId??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="">All classes</option>
              {selectedDirectoryValueNotListed(result.filter.sectionId,result.sectionOptions.map(row=>row.id)) ?
                <option value={result.filter.sectionId}>Selected class (outside first 200)</option> : null}
              {result.sectionOptions.map(row=><option key={row.id} value={row.id}>{row.batchName} · {row.name}</option>)}
            </Select>
            {result.sectionOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 classes shown.</span> : null}
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active program
            <Select name="programId" defaultValue={result.filter.programId??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="">All programs</option>
              {selectedDirectoryValueNotListed(result.filter.programId,result.programOptions.map(row=>row.id)) ?
                <option value={result.filter.programId}>Selected program (outside first 200)</option> : null}
              {result.programOptions.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
            {result.programOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 programs shown.</span> : null}
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active batch
            <Select name="cohortId" defaultValue={result.filter.cohortId ?? ""}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
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
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Department
            <Select name="facultyDepartmentId" defaultValue={result.filter.facultyDepartmentId ?? ""}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="">All departments</option>
              {selectedDirectoryValueNotListed(result.filter.facultyDepartmentId,result.departmentOptions.map(d=>d.id)) ?
                <option value={result.filter.facultyDepartmentId}>Selected department (outside first 200)</option> : null}
              {result.departmentOptions.map(dept=><option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </Select>
            {result.departmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              Only first 200 departments shown; use name search for others.
            </span> : null}
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Employment type
            <Select name="employmentType" defaultValue={result.filter.employmentType ?? ""}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="">All employment types</option>
              {selectedDirectoryValueNotListed(result.filter.employmentType,result.employmentOptions) ?
                <option value={result.filter.employmentType}>Selected type (outside first 100)</option> : null}
              {result.employmentOptions.map(value=><option key={value} value={value}>{value}</option>)}
            </Select>
            {result.employmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 100 distinct types shown.
            </span> : null}
          </label> : null}
          <details className="min-w-0 basis-full rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3"
            open={collegeRoleDirectoryHasActiveFilters(kind,result.filter)}>
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-foreground">Advanced filters</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Platform account
            <Select name="accountStatus" defaultValue={result.filter.accountStatus}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All accounts</option>
              <option value="ACTIVE">Active accounts</option>
              <option value="DISABLED">Disabled accounts</option>
            </Select>
          </label>
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active enrollment
            <Select name="enrollment" defaultValue={result.filter.enrollment}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All learners</option>
              <option value="ACTIVE">Has active program enrollment</option>
              <option value="NONE">No active program enrollment</option>
            </Select>
          </label> : null}



          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Roll number coverage
            <Select name="rollPresence" defaultValue={result.filter.rollPresence}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All learners</option>
              <option value="PRESENT">Roll recorded</option>
              <option value="MISSING">Roll missing</option>
            </Select>
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Registration number coverage
            <Select name="registrationPresence" defaultValue={result.filter.registrationPresence}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All learners</option>
              <option value="PRESENT">Registration recorded</option>
              <option value="MISSING">Registration missing</option>
            </Select>
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active class placement
            <Select name="classPresence" defaultValue={result.filter.classPresence}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All learners</option>
              <option value="ASSIGNED">Has active class</option>
              <option value="NONE">No active class</option>
            </Select>
          </label> : null}


          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Academic title coverage
            <Select name="titlePresence" defaultValue={result.filter.titlePresence}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All faculty</option>
              <option value="PRESENT">Title recorded</option>
              <option value="MISSING">Title missing</option>
            </Select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Primary department coverage
            <Select name="departmentPresence" defaultValue={result.filter.departmentPresence}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Department recorded</option>
              <option value="MISSING">Department missing</option>
            </Select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Course teaching
            <Select name="teaching" defaultValue={result.filter.teaching}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Has active teaching</option>
              <option value="NONE">No active teaching</option>
            </Select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active course teaching role
            <Select name="teachingRole" defaultValue={result.filter.teachingRole}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="ALL">Any role</option>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-teacher</option>
              <option value="TA">Teaching assistant</option>
            </Select>
          </label> : null}
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Joined from (IST)
            <Input type="date" name="joinedFrom" defaultValue={result.filter.joinedFrom??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm" />
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Joined through (IST)
            <Input type="date" name="joinedThrough" defaultValue={result.filter.joinedThrough??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm" />
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Order
            <Select name="sort" defaultValue={result.filter.sort}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="NAME">Name A–Z</option>
              <option value="NAME_DESC">Name Z–A</option>
              <option value="NEWEST">Newest membership</option>
              <option value="OLDEST">Oldest membership</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Rows per page
            <Select name="pageSize" defaultValue={result.filter.pageSize} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary text-base sm:text-sm">
              <option value="10">10</option><option value="25">25</option><option value="50">50</option>
            </Select>
          </label>
            </div>
          </details>
          <Button variant="primary" type="submit" className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-primary px-5 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Apply
          </Button>
          <Link href={path} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Clear
          </Link>
        </form>
      </section>

      <section aria-label={title + " results"} className="rounded-[var(--lms-control-radius)] border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {result.total} matching {kind === "FACULTY" ? "faculty" : "learner"} membership{result.total === 1 ? "" : "s"}
        </p>
        {result.items.length === 0 ? (
          <div role="status" className="space-y-3 p-6 text-sm text-body">
            <p>{result.total === 0
              ? collegeRoleDirectoryHasActiveFilters(kind,result.filter)
                ? "No memberships match these directory filters."
                : "No role memberships are recorded in this college."
              : "There are no records on this page. Select an earlier page."}</p>
            {collegeRoleDirectoryHasActiveFilters(kind,result.filter) ?
              <Link href={path} className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear roster filters</Link> : null}
          </div>
        ) : (
          <>
          <ul aria-label={title + " mobile records"} className="space-y-3 p-3 md:hidden">
            {result.items.map(item=>(
              <li key={item.membershipId} className="min-w-0 space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
                <div className="min-w-0">
                  <Link href={kind==="LEARNER"?"/college/students/"+item.membershipId:"/college/faculty/"+item.membershipId}
                    className="break-words font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{item.name}</Link>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{item.email??"No email recorded"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={item.membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE"?"success":"warning"}>
                    {item.membershipStatus}
                  </StatusBadge>
                  {item.userStatus!=="ACTIVE"?<span className="text-xs text-warning">Account: {item.userStatus}</span>:null}
                </div>
                <p className="break-words text-sm text-body">{describeCollegeDirectoryContext(kind,item)}</p>
                <p className="text-xs text-muted-foreground">Joined {joinedLabel(item.joinedAt)} IST</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link href={collegeRoleContactHref(item.membershipId)}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View contact card</Link>
                  {kind==="LEARNER"?<Link href={collegeLearnerVerificationHref(item.membershipId)}
                    className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Profile verification</Link>:null}
                </div>
                {kind==="LEARNER"&&item.membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE"&&item.cohort!==null?
                  <StudentClassMoveAction membershipId={item.membershipId} name={item.name}/>:null}
                <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
                  departments={kind==="FACULTY"?result.departmentOptions:[]}/>
                {kind==="FACULTY"?<CollegeFacultyLifecycleAction membershipId={item.membershipId}
                  name={item.name} status={item.membershipStatus}/>:null}
                {kind==="LEARNER"?<CollegeStudentLifecycleAction membershipId={item.membershipId}
                  name={item.name} status={item.membershipStatus}/>:null}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <DataTable
              caption={title+" directory"}
              rows={result.items}
              getRowKey={item=>item.membershipId}
              empty={<p>No role memberships match the selected filters.</p>}
              columns={[
                {key:"person",header:"Person",mobilePriority:"primary",cell:item=><>
                  <Link href={kind==="LEARNER"?"/college/students/"+item.membershipId:"/college/faculty/"+item.membershipId}
                    className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.email??"No email recorded"}</p>
                  <Link href={collegeRoleContactHref(item.membershipId)}
                    className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    View contact card
                  </Link>
                  {kind==="LEARNER"?<Link href={collegeLearnerVerificationHref(item.membershipId)}
                    className="ml-3 inline-flex min-h-11 items-center text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    Profile verification
                  </Link>:null}
                </>},
                {key:"membership",header:"Membership",mobilePriority:"secondary",cell:item=><>
                  <StatusBadge tone={item.membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE"?"success":"warning"}>
                    {item.membershipStatus}
                  </StatusBadge>
                  {item.userStatus!=="ACTIVE"?<p className="mt-1 text-xs text-warning">
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                      <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                      <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
                        departments={kind==="FACULTY"?result.departmentOptions:[]}/>
                    </div>
                    {kind==="FACULTY"?<CollegeFacultyLifecycleAction membershipId={item.membershipId}
                      name={item.name} status={item.membershipStatus}/>:null}
                    {kind==="LEARNER"?<CollegeStudentLifecycleAction membershipId={item.membershipId}
                      name={item.name} status={item.membershipStatus}/>:null}
                </>},
                {key:"joined",header:"Joined",mobilePriority:"secondary",cell:item=>joinedLabel(item.joinedAt)},
              ]}
            />
          </div>
          </>
        )}
      </section>

      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {result.filter.page} of {result.totalPages} · Showing {collegeRoleDirectoryPageRange(result.filter.page,result.pageSize,result.total).first}–{collegeRoleDirectoryPageRange(result.filter.page,result.pageSize,result.total).last} of {result.total} memberships
        </p>
        <div className="flex gap-2">
          {result.filter.page > 1 ? (
            <Link
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page - 1 })}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Previous
            </Link>
          ) : null}
          {result.filter.page < result.totalPages ? (
            <Link
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page + 1 })}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Next
            </Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        CSV applies the same roster filters as this view, not just name and status.
        Export includes only current-college role memberships, rechecks College Admin access and is capped at 1,000 rows.
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        Directory records are scoped to this college.
        {kind === "FACULTY"
          ? " Counts are active teaching assignments, not a complete workload or schedule."
          : " Only active academic enrollments and classes are shown; absent associations are not inferred."}
        Creation, import, editing, profile details and lifecycle actions remain in their existing workspaces.
      </p>
    </div>
  );
}
