import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
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
          action={<Link href={path} className="font-semibold text-primary-text hover:underline">Clear directory filters</Link>}
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
                Import faculty CSV
              </Link>
            ) : null}
            {kind === "LEARNER" ? (
              <Link href="/college/students/register"
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
                Register students
              </Link>
            ) : null}
            {kind==="LEARNER"?<CollegeStudentImportHistory/>:null}
            {kind === "LEARNER" ? (
              <Link href="/college/students/import"
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
                Import CSV
              </Link>
            ) : null}
            <Link href={"/api/college/roles/export-visible?kind="+kind+"&"+
              new URL(collegeRoleDirectoryExportHref(kind,result.filter),"https://lms.invalid").searchParams.toString()}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Export visible {kind==="FACULTY"?"faculty.csv":"students.csv"}
            </Link>
            <Link href={collegeRoleDirectoryExportHref(kind,result.filter)}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Export {kind === "FACULTY" ? "Faculty" : "Learner"} CSV (max 1,000)
            </Link>
            <Link href="/college/people"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
              People directory
            </Link>
          </>
        }
      />

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label={title + " directory filters"}>
        <form method="get" action={path} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-48 flex-1 gap-2 text-sm font-semibold text-body">
            {collegeDirectorySearchHint(kind)}
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={result.filter.q}
              placeholder="Search this college"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"
            />
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Membership status
            <select
              name="status"
              defaultValue={result.filter.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ENDED">Ended</option>
            </select>
          </label>
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active class / section
            <select name="sectionId" defaultValue={result.filter.sectionId??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All classes</option>
              {selectedDirectoryValueNotListed(result.filter.sectionId,result.sectionOptions.map(row=>row.id)) ?
                <option value={result.filter.sectionId}>Selected class (outside first 200)</option> : null}
              {result.sectionOptions.map(row=><option key={row.id} value={row.id}>{row.batchName} · {row.name}</option>)}
            </select>
            {result.sectionOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 classes shown.</span> : null}
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active program
            <select name="programId" defaultValue={result.filter.programId??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {selectedDirectoryValueNotListed(result.filter.programId,result.programOptions.map(row=>row.id)) ?
                <option value={result.filter.programId}>Selected program (outside first 200)</option> : null}
              {result.programOptions.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            {result.programOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 programs shown.</span> : null}
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active batch
            <select name="cohortId" defaultValue={result.filter.cohortId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All batches</option>
              {selectedDirectoryValueNotListed(result.filter.cohortId,result.cohortOptions.map(c=>c.id)) ?
                <option value={result.filter.cohortId}>Selected batch (outside first 200)</option> : null}
              {result.cohortOptions.map(cohort=><option key={cohort.id} value={cohort.id}>
                {cohort.programName} · {cohort.name}
              </option>)}
            </select>
            {result.cohortOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 200 batches shown; search by name for others.
            </span> : null}
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Department
            <select name="facultyDepartmentId" defaultValue={result.filter.facultyDepartmentId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All departments</option>
              {selectedDirectoryValueNotListed(result.filter.facultyDepartmentId,result.departmentOptions.map(d=>d.id)) ?
                <option value={result.filter.facultyDepartmentId}>Selected department (outside first 200)</option> : null}
              {result.departmentOptions.map(dept=><option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
            {result.departmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              Only first 200 departments shown; use name search for others.
            </span> : null}
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Employment type
            <select name="employmentType" defaultValue={result.filter.employmentType ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All employment types</option>
              {selectedDirectoryValueNotListed(result.filter.employmentType,result.employmentOptions) ?
                <option value={result.filter.employmentType}>Selected type (outside first 100)</option> : null}
              {result.employmentOptions.map(value=><option key={value} value={value}>{value}</option>)}
            </select>
            {result.employmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 100 distinct types shown.
            </span> : null}
          </label> : null}
          <details className="min-w-0 basis-full rounded-md border border-border bg-surface-subtle p-3"
            open={collegeRoleDirectoryHasActiveFilters(kind,result.filter)}>
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-foreground">Advanced filters</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Platform account
            <select name="accountStatus" defaultValue={result.filter.accountStatus}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All accounts</option>
              <option value="ACTIVE">Active accounts</option>
              <option value="DISABLED">Disabled accounts</option>
            </select>
          </label>
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active enrollment
            <select name="enrollment" defaultValue={result.filter.enrollment}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All learners</option>
              <option value="ACTIVE">Has active program enrollment</option>
              <option value="NONE">No active program enrollment</option>
            </select>
          </label> : null}



          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Roll number coverage
            <select name="rollPresence" defaultValue={result.filter.rollPresence}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All learners</option>
              <option value="PRESENT">Roll recorded</option>
              <option value="MISSING">Roll missing</option>
            </select>
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Registration number coverage
            <select name="registrationPresence" defaultValue={result.filter.registrationPresence}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All learners</option>
              <option value="PRESENT">Registration recorded</option>
              <option value="MISSING">Registration missing</option>
            </select>
          </label> : null}
          {kind === "LEARNER" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active class placement
            <select name="classPresence" defaultValue={result.filter.classPresence}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All learners</option>
              <option value="ASSIGNED">Has active class</option>
              <option value="NONE">No active class</option>
            </select>
          </label> : null}


          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Academic title coverage
            <select name="titlePresence" defaultValue={result.filter.titlePresence}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All faculty</option>
              <option value="PRESENT">Title recorded</option>
              <option value="MISSING">Title missing</option>
            </select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Primary department coverage
            <select name="departmentPresence" defaultValue={result.filter.departmentPresence}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Department recorded</option>
              <option value="MISSING">Department missing</option>
            </select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Course teaching
            <select name="teaching" defaultValue={result.filter.teaching}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Has active teaching</option>
              <option value="NONE">No active teaching</option>
            </select>
          </label> : null}
          {kind === "FACULTY" ? <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Active course teaching role
            <select name="teachingRole" defaultValue={result.filter.teachingRole}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any role</option>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-teacher</option>
              <option value="TA">Teaching assistant</option>
            </select>
          </label> : null}
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Joined from (IST)
            <input type="date" name="joinedFrom" defaultValue={result.filter.joinedFrom??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Joined through (IST)
            <input type="date" name="joinedThrough" defaultValue={result.filter.joinedThrough??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Order
            <select name="sort" defaultValue={result.filter.sort}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="NAME">Name A–Z</option>
              <option value="NAME_DESC">Name Z–A</option>
              <option value="NEWEST">Newest membership</option>
              <option value="OLDEST">Oldest membership</option>
            </select>
          </label>
          <label className="grid min-w-36 gap-2 text-sm font-semibold text-body">
            Rows per page
            <select name="pageSize" defaultValue={result.filter.pageSize} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="10">10</option><option value="25">25</option><option value="50">50</option>
            </select>
          </label>
            </div>
          </details>
          <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
            Apply
          </button>
          <Link href={path} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>

      <section aria-label={title + " results"} className="overflow-x-auto rounded-xl border border-border bg-surface">
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
              <Link href={path} className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Clear roster filters</Link> : null}
          </div>
        ) : (
          <>
          <ul aria-label={title + " mobile records"} className="space-y-3 p-3 md:hidden">
            {result.items.map(item=>(
              <li key={item.membershipId} className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-4">
                <div className="min-w-0">
                  <Link href={kind==="LEARNER"?"/college/students/"+item.membershipId:"/college/faculty/"+item.membershipId}
                    className="break-words font-semibold text-primary-text underline">{item.name}</Link>
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
                    className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">View contact card</Link>
                  {kind==="LEARNER"?<Link href={collegeLearnerVerificationHref(item.membershipId)}
                    className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Profile verification</Link>:null}
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
          <table className="hidden w-full min-w-[45rem] text-left text-sm md:table">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Person</th>
                <th scope="col" className="px-4 py-3">Membership</th>
                <th scope="col" className="px-4 py-3">
                  {kind === "FACULTY" ? "Teaching assignments" : "Program · Batch · Class"}
                </th>
                <th scope="col" className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.membershipId} className="border-t border-border align-top">
                  <td className="px-4 py-4">
                    <Link href={kind === "LEARNER" ? `/college/students/${item.membershipId}` : `/college/faculty/${item.membershipId}`}
                      className="font-semibold text-primary-text hover:underline">{item.name}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.email ?? "No email recorded"}</p>
                    <Link href={collegeRoleContactHref(item.membershipId)} className="mt-1 inline-flex min-h-10 items-center text-xs font-semibold text-primary-text hover:underline">View contact card</Link>
                    {kind==="LEARNER"&&<Link href={collegeLearnerVerificationHref(item.membershipId)} className="ml-3 inline-flex min-h-10 items-center text-xs font-semibold text-primary-text hover:underline">Profile verification</Link>}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={item.membershipStatus === "ACTIVE" && item.userStatus === "ACTIVE" ? "success" : "warning"}>
                      {item.membershipStatus}
                    </StatusBadge>
                    {item.userStatus !== "ACTIVE" ? (
                      <p className="mt-1 text-xs text-warning">Platform account: {item.userStatus}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-body">
                    {describeCollegeDirectoryContext(kind, item)}
                    {kind === "LEARNER" && item.membershipStatus === "ACTIVE" &&
                      item.userStatus === "ACTIVE" && item.cohort !== null ?
                      <div className="mt-2">
                        <StudentClassMoveAction membershipId={item.membershipId} name={item.name} />
                      </div> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                      <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
                        departments={kind==="FACULTY"?result.departmentOptions:[]}/>
                    </div>
                    {kind === "FACULTY" ?
                      <CollegeFacultyLifecycleAction
                        membershipId={item.membershipId}
                        name={item.name}
                        status={item.membershipStatus}
                      /> : null}
                    {kind === "LEARNER" ?
                      <CollegeStudentLifecycleAction membershipId={item.membershipId}
                        name={item.name} status={item.membershipStatus} /> : null}
                  </td>
                  <td className="px-4 py-4 text-body">
                    {joinedLabel(item.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
            >
              Previous
            </Link>
          ) : null}
          {result.filter.page < result.totalPages ? (
            <Link
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page + 1 })}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
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
