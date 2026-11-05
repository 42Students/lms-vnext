import { Select } from "@/components/ui/select";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { CollegeFacultyScheduleReassign } from "@/components/college/college-faculty-schedule-reassign";
import { CollegeStudentBulkModuleAccess } from "@/components/college/college-student-bulk-module-access";
import { CollegeRoleDirectoryAutocomplete } from "@/components/college/college-role-directory-autocomplete";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";

type RawSearch = Record<string, string | string[] | undefined>;

function joinedLabel(value: Date) {
  return istDateFormatter.format(value);
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
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title={title} />
    <ErrorState title="Admin not assigned to a college"
      description="You are not assigned to a college. Contact your administrator to restore access to the roster."
      action={<TextLink href="/dashboard" className="inline-flex min-h-11 items-center md:min-h-9">Back to dashboard</TextLink>}/>
  </div>;

  let filter: ReturnType<typeof parseCollegeRoleDirectorySearchParams>;
  try {
    const rawFilters=await searchParams;
    filter = parseCollegeRoleDirectorySearchParams(
      kind==="LEARNER"&&!Object.hasOwn(rawFilters,"pageSize")
        ? {...rawFilters,pageSize:"10"} : rawFilters,
    );
    assertCompatibleCollegeRoleDirectoryFilters(kind,filter);
  } catch (error) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader title={title} />
        <ErrorState
          title="Invalid directory filters"
          description={collegeRoleDirectoryFilterMessage(error)}
          action={<TextLink href={path}>Clear directory filters</TextLink>}
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
        action={<TextLink href={collegeRoleDirectoryHref(kind,filter)}
          className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>} />
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
    {kind==="FACULTY" && item.membershipStatus==="ACTIVE" && item.userStatus==="ACTIVE"
      ? <CollegeFacultyScheduleReassign membershipId={item.membershipId} name={item.name}/> : null}
    {kind==="LEARNER" && item.membershipStatus==="ACTIVE"&&
      item.userStatus==="ACTIVE"&&item.cohort!==null
      ? <StudentClassMoveAction membershipId={item.membershipId} name={item.name}/> : null}
    <TextLink href="/college/otp-lockout"
      className="inline-flex min-h-11 items-center text-xs md:min-h-9"
      aria-label={"Open authorized OTP recovery for "+item.name}>
      Clear OTP lockout
    </TextLink>
    <TextLink href={(kind==="LEARNER"?"/college/students/":"/college/faculty/")+item.membershipId}
      className="inline-flex min-h-11 items-center text-xs md:min-h-9"
      aria-label={"Open full "+(kind==="LEARNER"?"student":"faculty")+" profile for "+item.name}>
      Full profile
    </TextLink>
  </div>;
  // Legacy student order: Name, Roll No., Mobile, Email, Class, Gender,
  // Status, Actions. Sensitive contact/gender and roll are not present in the
  // college-scoped list read model; link to authorized detail instead of
  // inventing PII or querying another tenant's identity.
  const studentColumns: DataTableColumn<Row>[] = [
    {key:"name",header:"Name",mobilePriority:"primary",cell:item=>
      <TextLink href={"/college/students/"+item.membershipId}>{item.name}</TextLink>},
    {key:"roll",header:<TextLink href={collegeRoleDirectoryHref(kind,{
        ...result.filter,sort:result.filter.sort==="ROLL"?"ROLL_DESC":"ROLL",page:1})} aria-label="Sort by roll number">
        Roll No. {result.filter.sort==="ROLL"?"↑":result.filter.sort==="ROLL_DESC"?"↓":"↕"}</TextLink>,cell:item=>
      item.rollNumber ? <span title={item.rollNumber} className="max-w-32 truncate font-mono text-sm">{item.rollNumber}</span> : "—"},
    {key:"mobile",header:"Mobile",cell:item=>
      <TextLink href={collegeRoleContactHref(item.membershipId)}>View contact card</TextLink>},
    {key:"email",header:"Email",cell:item=>item.email?
      <span title={item.email} className="block max-w-52 truncate">{item.email}</span>:"—"},
    {key:"class",header:"Class",cell:item=>item.sections.length?
      [...new Set(item.sections)].join(", "):"—"},
    {key:"gender",header:"Gender",cell:()=><span title="Gender is available only from an authorized profile, not the roster">—</span>},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><>
      <StatusBadge tone={effectiveStatus(item)==="Active"?"success":"warning"}>
        {effectiveStatus(item)}
      </StatusBadge>
      {item.userStatus!=="ACTIVE"?<p className="mt-1 text-xs text-warning">Account: {item.userStatus}</p>:null}
    </>},
    {key:"actions",header:"Actions",className:"text-right",cell:actions},
  ];
  const facultyColumns: DataTableColumn<Row>[] = [
    {key:"name",header:<TextLink href={collegeRoleDirectoryHref(kind,{
      ...result.filter,sort:result.filter.sort==="NAME"?"NAME_DESC":"NAME",page:1})} aria-label="Sort by faculty name">
      Name {result.filter.sort==="NAME_DESC"?"↓":"↑"}</TextLink>,mobilePriority:"primary",cell:item=>
      <TextLink href={"/college/faculty/"+item.membershipId}>{item.name||"—"}</TextLink>},
    {key:"department",header:"Department",cell:item=>item.department||"—"},
    {key:"mobile",header:"Mobile",cell:item=>
      <TextLink href={collegeRoleContactHref(item.membershipId)} aria-label={"View permitted mobile contact for "+item.name}>View contact</TextLink>},
    {key:"email",header:"Email",cell:item=>item.email?
      <span title={item.email} className="block max-w-52 truncate">{item.email}</span>:"—"},
    {key:"type",header:"Type",cell:item=>item.employmentType?
      <StatusBadge tone="neutral">{item.employmentType.replaceAll("_"," ")}</StatusBadge>:"—"},
    {key:"gender",header:"Gender",cell:()=>
      <span title="Gender is not exposed in the directory for privacy">—</span>},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
      <StatusBadge tone={effectiveStatus(item)==="Active"?"success":"warning"}>{effectiveStatus(item)}</StatusBadge>},
    {key:"actions",header:"Actions",className:"text-right",cell:actions},
  ];
  return (
    <div className="min-w-0 space-y-6 md:space-y-6">
      <PageHeader
        title={title}
        description={
          kind === "FACULTY"
            ? "Register faculty and manage their profiles. Allocate teaching through Faculty Assignment."
            : "Registered students, batch and class membership, and student lifecycle actions."
        }
        actions={kind === "FACULTY" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden="true" className="font-bold text-[var(--lms-primary-text)]">+</span>
            <PersonOnboardDialog collegeId={context.membership.collegeId} forcedRole="FACULTY" />
          </div>
        ) : (
          <ButtonLink variant="secondary" href="/college/students/register">
            Register students
          </ButtonLink>
        )}
      />

      {kind === "LEARNER" ? <div className="min-w-0 space-y-2">
        <Heading level={2} size="base" className="text-[var(--lms-heading)]">Registered Students</Heading>
        <Disclosure title="Register students" className="min-w-0">
          <div className="flex flex-wrap items-center gap-4 py-2 text-sm">
            <TextLink href="/college/students/register">
              Single student registration form
            </TextLink>
            <TextLink href="/college/students/import">
              Bulk Register Students (CSV)
            </TextLink>
            <span className="text-muted-foreground">Registration is scoped to your current college and its active batch.</span>
          </div>
        </Disclosure>
      </div> : null}
      {kind === "LEARNER" ? <CollegeStudentBulkModuleAccess
        students={result.items.map(item=>({
          membershipId:item.membershipId,name:item.name,
          active:item.membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE",
        }))} /> : null}
      {kind === "LEARNER" ? <nav aria-label="Student directory tools"
        className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3 text-sm">
        <TextLink href="/college/students/import"
          className="inline-flex min-h-11 items-center md:min-h-9">Bulk Register Students</TextLink>
        <CollegeStudentImportHistory />
        <Disclosure title="CSV exports" className="min-w-0">
          <div className="flex min-w-0 flex-col gap-2 border-t border-border py-2">
            <TextLink href={"/api/college/roles/export-visible?kind="+kind+"&"+
              new URL(collegeRoleDirectoryExportHref(kind,result.filter),"https://lms.invalid").searchParams.toString()}
              className="inline-flex min-h-11 items-center md:min-h-9">Export visible students.csv</TextLink>
            <TextLink href={collegeRoleDirectoryExportHref(kind,result.filter)}
              className="inline-flex min-h-11 items-center md:min-h-9">Export Learner CSV (max 1,000)</TextLink>
          </div>
        </Disclosure>
        <TextLink href="/college/people"
          className="inline-flex min-h-11 items-center md:min-h-9">People Directory</TextLink>
      </nav> : null}
      {kind === "FACULTY" ? <div className="space-y-2">
        <Heading level={2} className="text-[var(--lms-font-lg)] text-[var(--lms-heading)]">Registered Faculty</Heading>
        <TextLink href="/college/faculty-assignment"
          className="inline-flex min-h-11 items-center md:min-h-9">Faculty Assignment →</TextLink>
      </div> : null}
      <p className="text-xs leading-5 text-muted-foreground" role="note">
        Legacy permanent deletion is replaced by reversible, college-scoped membership
        suspension, preserving shared identity, academic work, placement history and
        audit events. The Clear OTP lockout link opens an authorized support form
        which independently verifies the person and records a reason; it does not
        bypass anti-abuse restrictions. Active faculty can reassign class schedules
        before suspension.
      </p>
      {kind === "FACULTY" ? <nav aria-label="Faculty directory tools" className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3 text-sm">
        <TextLink href="/college/faculty/import" className="inline-flex min-h-11 items-center md:min-h-9">Import faculty CSV</TextLink>
        <TextLink href={collegeRoleDirectoryHref(kind,result.filter)}
          className="inline-flex min-h-11 items-center md:min-h-9">Refresh</TextLink>
        <Disclosure title="Export Faculty CSV (max 1,000)" className="min-w-0">
          <div className="flex min-w-0 flex-col gap-2 border-t border-border py-2">
            <TextLink href={"/api/college/roles/export-visible?kind="+kind+"&"+
              new URL(collegeRoleDirectoryExportHref(kind,result.filter),"https://lms.invalid").searchParams.toString()}
              className="inline-flex min-h-11 items-center md:min-h-9">Export visible faculty.csv</TextLink>
            <TextLink href={collegeRoleDirectoryExportHref(kind,result.filter)}
              className="inline-flex min-h-11 items-center md:min-h-9">Export Faculty CSV (max 1,000)</TextLink>
          </div>
        </Disclosure>
        <TextLink href="/college/people" className="inline-flex min-h-11 items-center md:min-h-9">People Directory</TextLink>
      </nav> : null}
      <section aria-label={title+" directory summary"} className="grid min-w-0 grid-cols-2 gap-3 border-y border-border py-3 md:grid-cols-4">
        {[
          [title,result.metrics.registered],
          ["Active",result.metrics.active],
          ["Suspended",result.metrics.suspended],
        ].map(([label,value])=><StatTile key={label} variant="college" label={String(label)} value={value}/>)}
        <StatTile variant="college" label="Visible now" value={result.total}/>
        <p className="col-span-full text-xs text-muted-foreground leading-[20px]">
          Visible now means {formatNumberIN(result.total)} matching the selected roster filters, not online presence.
        </p>
      </section>
      <section className="min-w-0 border-t border-border pt-4" aria-label={title + " directory filters"}>
        <form method="get" action={path} className="grid min-w-0 grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Label stack className="min-w-0">
            {collegeDirectorySearchHint(kind)}
            <CollegeRoleDirectoryAutocomplete
              kind={kind} collegeId={context.membership.collegeId}
              defaultValue={result.filter.q}
              popular={result.items.slice(0,15).map(row=>({
                membershipId:row.membershipId,name:row.name??"Unnamed",
              }))}
            />
            <span className="text-xs font-normal text-muted-foreground">200ms suggestions search this college only. Recent searches remain in this browser session.</span>
          </Label>
          <Label stack className="min-w-0">
            Membership status
            <Select className="min-h-11 w-full min-w-0 md:min-h-9"
              name="status"
              defaultValue={result.filter.status}
              
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ENDED">Ended</option>
            </Select>
            <span className="text-xs font-normal text-muted-foreground">All, Active and Suspended match the legacy roster. Ended shows closed college memberships separately; statuses are scoped to this college, not the user account.</span>
          </Label>
          {kind === "LEARNER" ? <Label stack className="min-w-0">
            Active class / section
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="sectionId" defaultValue={result.filter.sectionId??""} >
              <option value="">All classes</option>
              {selectedDirectoryValueNotListed(result.filter.sectionId,result.sectionOptions.map(row=>row.id)) ?
                <option value={result.filter.sectionId}>Selected class (outside first 200)</option> : null}
              {result.sectionOptions.map(row=><option key={row.id} value={row.id}>{row.batchName} · {row.name}</option>)}
            </Select>
            {result.sectionOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 classes shown.</span> : null}
          </Label> : null}
          {kind === "LEARNER" ? <Label stack className="min-w-0">
            Active program
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="programId" defaultValue={result.filter.programId??""} >
              <option value="">All programs</option>
              {selectedDirectoryValueNotListed(result.filter.programId,result.programOptions.map(row=>row.id)) ?
                <option value={result.filter.programId}>Selected program (outside first 200)</option> : null}
              {result.programOptions.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
            {result.programOptionsTruncated ? <span className="text-xs text-muted-foreground">First 200 programs shown.</span> : null}
          </Label> : null}
          {kind === "LEARNER" ? <Label stack className="min-w-0">
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
          </Label> : null}
          {kind === "FACULTY" ? <Label stack className="min-w-0">
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
          </Label> : null}
          {kind === "FACULTY" ? <Label stack className="min-w-0">
            Employment type
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="employmentType" defaultValue={result.filter.employmentType ?? ""}
              >
              <option value="">All types</option>
              {selectedDirectoryValueNotListed(result.filter.employmentType,result.employmentOptions) ?
                <option value={result.filter.employmentType}>Selected type (outside first 100)</option> : null}
              {result.employmentOptions.map(value=><option key={value} value={value}>{value}</option>)}
            </Select>
            {result.employmentOptionsTruncated ? <span className="text-xs text-muted-foreground">
              First 100 distinct types shown.
            </span> : null}
          </Label> : null}
          <Disclosure title="Advanced filters" className="min-w-0 md:col-span-2 lg:col-span-4" defaultOpen={collegeRoleDirectoryHasActiveFilters(kind,result.filter)}>
            <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Label stack className="min-w-0">
            Platform account
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="accountStatus" defaultValue={result.filter.accountStatus}
              >
              <option value="ALL">All accounts</option>
              <option value="ACTIVE">Active accounts</option>
              <option value="DISABLED">Disabled accounts</option>
            </Select>
          </Label>
          {kind === "LEARNER" ? <Label stack className="min-w-0">
            Active enrollment
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="enrollment" defaultValue={result.filter.enrollment}
              >
              <option value="ALL">All learners</option>
              <option value="ACTIVE">Has active program enrollment</option>
              <option value="NONE">No active program enrollment</option>
            </Select>
          </Label> : null}



          {kind === "LEARNER" ? <Label stack className="min-w-0">
            Roll number coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="rollPresence" defaultValue={result.filter.rollPresence}
              >
              <option value="ALL">All learners</option>
              <option value="PRESENT">Roll recorded</option>
              <option value="MISSING">Roll missing</option>
            </Select>
          </Label> : null}
          {kind === "LEARNER" ? <Label stack className="min-w-0">
            Registration number coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="registrationPresence" defaultValue={result.filter.registrationPresence}
              >
              <option value="ALL">All learners</option>
              <option value="PRESENT">Registration recorded</option>
              <option value="MISSING">Registration missing</option>
            </Select>
          </Label> : null}
          {kind === "LEARNER" ? <Label stack className="min-w-0">
            Active class placement
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="classPresence" defaultValue={result.filter.classPresence}
              >
              <option value="ALL">All learners</option>
              <option value="ASSIGNED">Has active class</option>
              <option value="NONE">No active class</option>
            </Select>
          </Label> : null}


          {kind === "FACULTY" ? <Label stack className="min-w-0">
            Academic title coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="titlePresence" defaultValue={result.filter.titlePresence}
              >
              <option value="ALL">All faculty</option>
              <option value="PRESENT">Title recorded</option>
              <option value="MISSING">Title missing</option>
            </Select>
          </Label> : null}
          {kind === "FACULTY" ? <Label stack className="min-w-0">
            Primary department coverage
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="departmentPresence" defaultValue={result.filter.departmentPresence}
              >
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Department recorded</option>
              <option value="MISSING">Department missing</option>
            </Select>
          </Label> : null}
          {kind === "FACULTY" ? <Label stack className="min-w-0">
            Course teaching
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="teaching" defaultValue={result.filter.teaching}
              >
              <option value="ALL">All faculty</option>
              <option value="ASSIGNED">Has active teaching</option>
              <option value="NONE">No active teaching</option>
            </Select>
          </Label> : null}
          {kind === "FACULTY" ? <Label stack className="min-w-0">
            Active course teaching role
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="teachingRole" defaultValue={result.filter.teachingRole}
              >
              <option value="ALL">Any role</option>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-Teacher</option>
              <option value="TA">Teaching Assistant</option>
            </Select>
          </Label> : null}
          <Label stack className="min-w-0">
            Joined from (IST)
            <Input className="min-h-11 w-full min-w-0 md:min-h-9" type="date" name="joinedFrom" defaultValue={result.filter.joinedFrom??""}  />
          </Label>
          <Label stack className="min-w-0">
            Joined through (IST)
            <Input className="min-h-11 w-full min-w-0 md:min-h-9" type="date" name="joinedThrough" defaultValue={result.filter.joinedThrough??""}  />
          </Label>
          <Label stack className="min-w-0">
            Order
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="sort" defaultValue={result.filter.sort}
              >
              <option value="NAME">Name A–Z</option>
              <option value="NAME_DESC">Name Z–A</option>
              {kind==="LEARNER"?<option value="ROLL">Roll number ↑</option>:null}
              {kind==="LEARNER"?<option value="ROLL_DESC">Roll number ↓</option>:null}
              <option value="NEWEST">Newest membership</option>
              <option value="OLDEST">Oldest membership</option>
            </Select>
          </Label>
          <Label stack className="min-w-0">
            Rows per page
            <Select className="min-h-11 w-full min-w-0 md:min-h-9" name="pageSize" defaultValue={result.filter.pageSize} >
              <option value="10">10</option><option value="25">25</option><option value="50">50</option>
              <option value="100">100</option><option value="200">200</option>
            </Select>
          </Label>
            </div>
          </Disclosure>
          <Button variant="primary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">
            Apply
          </Button>
          <TextLink href={path} className="inline-flex min-h-11 items-center md:min-h-9">
            Clear
          </TextLink>
        </form>
      </section>

      <section aria-label={title + " results"} className="min-w-0">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground leading-[22px]">
          {result.total} matching {kind === "FACULTY" ? "faculty" : "learner"} membership{result.total === 1 ? "" : "s"}
        </p>
        {result.items.length === 0 ? (
          <EmptyState title={kind==="FACULTY"?"No faculty found":"No students found"}
            description={result.total===0
              ? collegeRoleDirectoryHasActiveFilters(kind,result.filter)?"No matching records. Clear the filters to try again.":
                kind==="FACULTY"?"No faculty found. Register faculty members to get started.":"No students found. Register students to get started."
              : "There are no records on this page. Select an earlier page."}
            action={collegeRoleDirectoryHasActiveFilters(kind,result.filter)?
              <TextLink href={path} className="inline-flex min-h-11 items-center md:min-h-9">Clear roster filters</TextLink>:
              kind==="LEARNER"?<TextLink href="/college/students/register"
                className="inline-flex min-h-11 items-center md:min-h-9">
                Register students
              </TextLink>:<PersonOnboardDialog collegeId={context.membership.collegeId} forcedRole="FACULTY" />}/>
        ) : (
          <>
          <ul aria-label={title + " mobile records"} className="space-y-2 md:hidden">
            {result.items.map(item=>(
              <li key={item.membershipId} className="min-w-0 space-y-2 border-b border-border py-3">
                <div className="min-w-0">
                  <TextLink href={kind==="LEARNER"?"/college/students/"+item.membershipId:"/college/faculty/"+item.membershipId}
                    className="break-words">{item.name}</TextLink>
                  <p className="mt-1 break-all text-xs text-muted-foreground leading-[20px]">
                    {item.email??"—"}
                  </p>
                  {kind==="LEARNER"?<p className="mt-1 text-xs text-muted-foreground">
                    Roll No.: {item.rollNumber||"—"} · Class: {item.sections.join(", ")||"—"}
                  </p>:<p className="mt-1 text-xs text-muted-foreground">
                    Department: {item.department||"—"} · Type: {item.employmentType||"—"}
                  </p>}
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
                  <TextLink href={collegeRoleContactHref(item.membershipId)}
                    className="inline-flex min-h-11 items-center">View contact card</TextLink>
                  {kind==="LEARNER"?<TextLink href={collegeLearnerVerificationHref(item.membershipId)}
                    className="inline-flex min-h-11 items-center">Profile verification</TextLink>:null}
                </div>
                {kind==="LEARNER"&&item.membershipStatus==="ACTIVE"&&item.userStatus==="ACTIVE"&&item.cohort!==null?
                  <StudentClassMoveAction membershipId={item.membershipId} name={item.name}/>:null}
                <Disclosure title={<>More actions for {item.name}</>} className="min-w-0"><div className="flex min-w-0 flex-col items-start gap-2 pb-2">
                <CollegePersonAuditModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonProfileOverviewModal membershipId={item.membershipId} name={item.name} kind={kind}/>
                <CollegePersonEditAction membershipId={item.membershipId} kind={kind}
                  departments={kind==="FACULTY"?result.departmentOptions:[]}/>
                {kind==="FACULTY"?<CollegeFacultyLifecycleAction membershipId={item.membershipId}
                  name={item.name} status={item.membershipStatus}/>:null}
                {kind==="LEARNER"?<CollegeStudentLifecycleAction membershipId={item.membershipId}
                  name={item.name} status={item.membershipStatus}/>:null}
                </div></Disclosure>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <DataTable
              caption={title+" directory"}
              rows={result.items}
              getRowKey={item=>item.membershipId}
              empty={<EmptyState title="No role memberships" description="No role memberships match the selected filters."/>}
              columns={kind === "LEARNER" ? studentColumns : facultyColumns}
            />
          </div>
          </>
        )}
      </section>

      <nav aria-label={title + " pagination"} className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground leading-[22px]">
          Page {formatNumberIN(result.filter.page)} of {formatNumberIN(result.totalPages)} · Showing {formatNumberIN(collegeRoleDirectoryPageRange(result.filter.page,result.pageSize,result.total).first)}–{formatNumberIN(collegeRoleDirectoryPageRange(result.filter.page,result.pageSize,result.total).last)} of {formatNumberIN(result.total)} memberships
        </p>
        <div className="flex gap-2">
          {result.filter.page > 1 ? (
            <ButtonLink variant="secondary"
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page - 1 })}
              className="min-w-11 md:min-w-9"
            >
              Previous
            </ButtonLink>
          ) : null}
          {result.filter.page < result.totalPages ? (
            <ButtonLink variant="secondary"
              href={collegeRoleDirectoryHref(kind, { ...result.filter, page: result.filter.page + 1 })}
              className="min-w-11 md:min-w-9"
            >
              Next
            </ButtonLink>
          ) : null}
        </div>
      </nav>
      <p className="text-xs text-muted-foreground leading-[20px]">
        CSV applies the same roster filters as this view, not just name and status.
        Export includes only current-college role memberships, rechecks College Admin access and is capped at 1,000 rows.
        Faculty paging may show up to 200 rows but does not change the export cap.
      </p>
      <p className="text-xs text-muted-foreground leading-[20px]">
        Directory records are scoped to this college.
        {kind === "LEARNER" ? " Roll numbers are college-scoped roster fields. Sensitive contact and gender require the authorized detail or contact card. Account-wide suspension and membership suspension are distinct. Hard deletion and OTP unlock are not available here." : ""}
        {kind === "FACULTY"
          ? " Counts are active teaching assignments, not a complete workload or schedule."
          : " Only active academic enrollments and classes are shown; absent associations are not inferred."}
        Creation, import, editing, profile details and lifecycle actions remain in their existing workspaces.
      </p>
    </div>
  );
}
