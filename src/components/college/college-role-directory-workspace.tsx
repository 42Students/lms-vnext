import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { StudentClassMoveAction } from "@/components/college/student-class-move-action";
import { CollegeFacultyLifecycleAction } from "@/components/college/college-faculty-lifecycle-action";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import {
  collegeRoleDirectoryHref,
  collegeRoleDirectoryQuerySchema,
  describeCollegeDirectoryContext,
  collegeDirectorySearchHint,
  parseCollegeRoleDirectorySearchParams,
  canonicalCollegeRoleDirectoryHref,
  type CollegeDirectoryKind,
} from "@/modules/people/college-role-directory-model";
import { listCollegeRoleDirectory } from "@/modules/people/college-role-directory-service";
import { collegePeopleExportHref } from "@/modules/people/college-people-export-model";

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
  } catch {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="College Admin · People" title={title} />
        <ErrorState
          title="Invalid directory filters"
          description="A search, status or page value is invalid. No people were loaded."
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
            ? "College-scoped Faculty role memberships with persisted teaching assignment counts."
            : "College-scoped Learner role memberships with active academic enrollment context."
        }
        actions={
          <>
            {kind === "FACULTY" ? (
              <PersonOnboardDialog collegeId={context.membership.collegeId} forcedRole="FACULTY" />
            ) : null}
            {kind === "LEARNER" ? (
              <Link href="/college/students/import"
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
                Import CSV
              </Link>
            ) : null}
            <Link href={collegePeopleExportHref({q:result.filter.q,role:kind,status:result.filter.status})}
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
            Active batch
            <select name="cohortId" defaultValue={result.filter.cohortId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All batches</option>
              {result.cohortOptions.map(cohort=><option key={cohort.id} value={cohort.id}>
                {cohort.programName} · {cohort.name}
              </option>)}
            </select>
            {result.cohortOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 200 batches shown; search by name for others.
            </span> : null}
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
            Department
            <select name="facultyDepartmentId" defaultValue={result.filter.facultyDepartmentId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All departments</option>
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
              {result.employmentOptions.map(value=><option key={value} value={value}>{value}</option>)}
            </select>
            {result.employmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 100 distinct types shown.
            </span> : null}
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
            Order
            <select name="sort" defaultValue={result.filter.sort}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="NAME">Name A–Z</option>
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
          <p className="p-6 text-sm text-body">
            {result.total === 0
              ? "No matching role memberships were found in this college. Academic records may still exist outside this role-specific view."
              : "There are no records on this page. Select an earlier page."}
          </p>
        ) : (
          <table className="w-full min-w-[45rem] text-left text-sm">
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
                    {kind === "FACULTY" ?
                      <CollegeFacultyLifecycleAction
                        membershipId={item.membershipId}
                        name={item.name}
                        status={item.membershipStatus}
                      /> : null}
                  </td>
                  <td className="px-4 py-4 text-body">
                    {joinedLabel(item.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {result.filter.page} of {result.totalPages} · {result.pageSize} per page
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
        CSV applies name/email and membership-status filters only. Platform account,
        academic enrollment and teaching filters do not apply to export.
        College Admin CSV includes contacts and is capped at 1,000 rows.
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        Read-only source: registered memberships, roles and related college-owned records.
        {kind === "FACULTY"
          ? " Counts are active teaching assignments, not a complete workload or schedule."
          : " Only active academic enrollments and classes are shown; absent associations are not inferred."}
        Creation, import, editing, profile details and lifecycle actions remain in their existing workspaces.
      </p>
    </div>
  );
}
