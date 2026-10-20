import Link from "next/link";
import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
import {SuperAdminTodayBoard} from "@/components/admin/super-admin-today-board";
import {
  CollegeAdminDashboardActions,
  SuperAdminGlobalDashboardActions,
  SuperAdminCollegeDashboardActions,
} from "@/components/admin/admin-dashboard-actions";
import { getCurrentRequestContext } from "@/auth/request-context";
import { MembershipChooser } from "@/components/auth/membership-chooser";
import {
  getMembershipDashboardWorkspaces,
} from "@/components/dashboard/membership-dashboard-model";
import {
  getShellRoleLabel,
} from "@/components/shell/shell-model";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  hasActiveRecruiter,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import { listColleges } from "@/modules/colleges/service";
import { listDepartments } from "@/modules/departments/service";
import { listOrganizations } from "@/modules/organizations/service";
import {
  listCollegePeopleWithRuntime,
} from "@/modules/people/runtime";
import { listMembershipChoices } from "@/modules/identity/context-service";
import { listLearnerCourseDeliveries } from "@/modules/courses/learner-course-service";
import { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import {
  getPlacementTpoOperations,
} from "@/modules/placements/tpo-operations-service";
import {
  listMyProjectInstances,
} from "@/modules/projects/member-service";

function MetricCard({
  label,
  value,
  description,
  href,
}: {
  label: string;
  value: string | number;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-body">
        {description}
      </p>
    </>
  );

  return href ? (
    <Link
      href={href}
      className="flex min-h-11 flex-col rounded-[var(--lms-radius-card)] border border-border bg-surface p-5 transition-colors duration-[var(--lms-motion-fast)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
    >
      {content}
    </Link>
  ) : (
    <section className="rounded-xl border border-border bg-surface p-5">
      {content}
    </section>
  );
}

async function SuperAdminDashboard({
  context,
}: {
  context: RequestContext;
}) {
  const [organizations, colleges] = await Promise.all([
    listOrganizations(context),
    listColleges(context),
  ]);
  const collegeId = context.adminScope?.collegeId ?? null;
  const [departments, people] = collegeId
    ? await Promise.all([
        listDepartments(context, collegeId),
        listCollegePeopleWithRuntime(context, {
          collegeId,
          limit: 1,
          offset: 0,
        }),
      ])
    : [null, null];

  const glance=collegeId
    ?await getSuperAdminCollegeAtGlance(context,collegeId).catch(()=>null):null;
  const today=collegeId?await getSuperAdminTodayBoard(context,collegeId).catch(()=>null):null;
  const scopeLabel = collegeId
    ? `College scope · ${colleges.find((item) => item.id === collegeId)?.name ?? "Selected college"}`
    : context.adminScope?.organizationId
      ? `Organization scope · ${organizations.find((item) => item.id === context.adminScope?.organizationId)?.name ?? "Selected organization"}`
      : "All-platform scope";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Overview"
        description={`${scopeLabel}. Counts and actions follow the selected safety scope.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Organizations"
          value={organizations.length}
          description="Active organizations visible inside the current scope."
          href="/admin/organizations"
        />
        <MetricCard
          label="Colleges"
          value={colleges.length}
          description="Active colleges visible inside the current scope."
          href="/admin/colleges"
        />
        <MetricCard
          label="Departments"
          value={departments?.length ?? "—"}
          description={
            collegeId
              ? "Active departments in the selected college."
              : "Select a college scope to view tenant detail."
          }
          href="/admin/departments"
        />
        <MetricCard
          label="People"
          value={people?.pagination.total ?? "—"}
          description={
            collegeId
              ? "Memberships in the selected college."
              : "Select a college scope to view tenant detail."
          }
          href="/admin/people"
        />
      </div>
      {collegeId?<CollegeAtGlancePanel collegeId={collegeId} initial={glance}/>:null}
      {collegeId?<SuperAdminTodayBoard data={today}/>:null}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Safety scope
        </h2>
        <p className="mt-2 text-sm leading-6 text-body">
          {scopeLabel}. Use the selector in the top bar before
          college-specific administration. Global system-role
          management remains available only when the scope is cleared.
        </p>
      </section>
      {collegeId ? <SuperAdminCollegeDashboardActions /> : <SuperAdminGlobalDashboardActions />}
    </div>
  );
}

async function RecruiterDashboard({
  context,
}: {
  context: RequestContext;
}) {
  const jobs =
    await listOwnRecruiterPlacementJobs(
      context,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title={context.recruiter?.companyName ?? "Hiring dashboard"}
        description="Your hiring workspace is limited to explicit college-employer grants. College-private relationship notes and placement-cell controls remain hidden."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Granted colleges"
          value={
            context.recruiter?.grants.length ??
            0
          }
          description="Colleges that explicitly granted this employer account access."
          href="/hr/placements"
        />
        <MetricCard
          label="Visible opportunities"
          value={jobs.length}
          description="Published or closed opportunities for your exact employer grants."
          href="/hr/placements"
        />
      </div>
    </div>
  );
}

async function MembershipDashboard({
  context,
}: {
  context: RequestContext;
}) {
  const membership = context.membership;
  if (!membership) {
    return (
      <EmptyState
        title="Select a college"
        description="Choose an active college membership to open your role workspaces."
      />
    );
  }

  const workspaces =
    getMembershipDashboardWorkspaces(
      context,
    );
  const hasWorkspace = (
    workspace:
      (typeof workspaces)[number],
  ) => workspaces.includes(workspace);

  const [
    adminData,
    facultyCourses,
    learnerCourses,
    projectRows,
    placementOperations,
    learnerPlacementJobs,
    recruiterJobs,
  ] = await Promise.all([
    hasWorkspace("COLLEGE_ADMIN")
      ? Promise.all([
          listColleges(
            context,
            membership.organizationId,
          ),
          listDepartments(
            context,
            membership.collegeId,
          ),
          listCollegePeopleWithRuntime(
            context,
            {
              collegeId:
                membership.collegeId,
              limit: 1,
              offset: 0,
            },
          ),
        ])
      : Promise.resolve(null),
    hasWorkspace("FACULTY")
      ? listFacultyCourseDeliveries(
          context,
        )
      : Promise.resolve(null),
    hasWorkspace("LEARNER")
      ? listLearnerCourseDeliveries(
          context,
        )
      : Promise.resolve(null),
    hasWorkspace("MENTOR") ||
    hasWorkspace("LEARNER")
      ? listMyProjectInstances(context)
      : Promise.resolve(null),
    hasWorkspace("TPO")
      ? getPlacementTpoOperations(
          context,
          membership.collegeId,
        )
      : Promise.resolve(null),
    hasWorkspace("LEARNER")
      ? listLearnerPlacementJobs(
          context,
        )
      : Promise.resolve(null),
    hasActiveRecruiter(context)
      ? listOwnRecruiterPlacementJobs(
          context,
        )
      : Promise.resolve(null),
  ]);

  const mentorProjects =
    hasWorkspace("MENTOR")
      ? projectRows?.filter(
          (row) =>
            row.memberRole === "MENTOR",
        ) ?? []
      : null;
  const learnerProjects =
    hasWorkspace("LEARNER")
      ? projectRows?.filter(
          (row) =>
            row.memberRole === "LEARNER",
        ) ?? []
      : null;
  const primaryMentorships =
    mentorProjects?.filter(
      (row) => row.isPrimaryMentor,
    ).length ?? 0;
  const roleLabel =
    getShellRoleLabel(context);
  const college =
    adminData?.[0][0] ?? null;
  const departments =
    adminData?.[1] ?? null;
  const people =
    adminData?.[2] ?? null;

  if (
    workspaces.length === 0 &&
    !hasActiveRecruiter(context)
  ) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="College access"
          title="No workspace role assigned"
          description="Your membership is active, but it does not currently carry a Learner, Faculty, Mentor, TPO or College Admin workspace role."
        />
        <EmptyState
          title="No role workspace is available"
          description="Ask a College Admin to review the roles on this membership."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={roleLabel}
        title={
          college &&
          workspaces.length === 1 &&
          !hasActiveRecruiter(context)
            ? college.name
            : "Workspace dashboard"
        }
        description="Your active roles share one landing page. Every count and destination remains scoped through the same authenticated membership and permission rules."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {college ? (
          <MetricCard
            label="College"
            value={college.code}
            description={college.name}
            href="/college"
          />
        ) : null}

        {departments ? (
          <MetricCard
            label="Departments"
            value={departments.length}
            description="Active departments in your college."
            href="/college/departments"
          />
        ) : null}

        {people ? (
          <MetricCard
            label="People"
            value={people.pagination.total}
            description="Canonical memberships managed by your college."
            href="/college/people"
          />
        ) : null}

        {facultyCourses ? (
          <MetricCard
            label="Teaching Courses"
            value={facultyCourses.length}
            description="Exact Section Course deliveries assigned to this Faculty membership."
            href="/teach/courses"
          />
        ) : null}

        {mentorProjects ? (
          <MetricCard
            label="Mentoring Projects"
            value={mentorProjects.length}
            description={
              mentorProjects.length > 0
                ? `${primaryMentorships} primary mentorship${primaryMentorships === 1 ? "" : "s"} in this college.`
                : "Projects appear when this Mentor membership is assigned to a team."
            }
            href="/mentor/projects"
          />
        ) : null}

        {placementOperations ? (
          <>
            <MetricCard
              label="Live Placement Jobs"
              value={
                placementOperations.summary
                  .publishedJobs
              }
              description="Published opportunities currently operated by the placement cell."
              href="/tpo/placements"
            />
            <MetricCard
              label="Needs Attention"
              value={
                placementOperations.summary
                  .jobsNeedingAttention
              }
              description="Placement jobs with unresolved screening, scheduling, result or offer work."
              href="/tpo/placements"
            />
          </>
        ) : null}

        {learnerCourses ? (
          <MetricCard
            label="Active Courses"
            value={learnerCourses.length}
            description="Courses currently delivered to your active learner Section."
            href="/learn/courses"
          />
        ) : null}

        {learnerProjects ? (
          <MetricCard
            label="My Projects"
            value={learnerProjects.length}
            description="Project workspaces where this Learner membership is an active team member."
            href="/learn/projects"
          />
        ) : null}

        {learnerPlacementJobs ? (
          <MetricCard
            label="Placement Opportunities"
            value={learnerPlacementJobs.length}
            description="Placement opportunities currently visible to this Learner membership."
            href="/learn/placements"
          />
        ) : null}

        {recruiterJobs ? (
          <>
            <MetricCard
              label="Recruiter Colleges"
              value={
                context.recruiter?.grants
                  .length ?? 0
              }
              description="Colleges that explicitly granted this employer account access."
              href="/hr/placements"
            />
            <MetricCard
              label="Hiring Opportunities"
              value={recruiterJobs.length}
              description="Opportunities visible through your exact employer grants."
              href="/hr/placements"
            />
          </>
        ) : null}
      </div>
      {hasWorkspace("COLLEGE_ADMIN") ? <CollegeAdminDashboardActions /> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const context =
    await getCurrentRequestContext();

  if (isSuperAdmin(context)) {
    return (
      <SuperAdminDashboard
        context={context}
      />
    );
  }

  if (!context.membership) {
    if (hasActiveRecruiter(context)) {
      return (
        <RecruiterDashboard
          context={context}
        />
      );
    }

    const memberships =
      await listMembershipChoices(
        context.user.identityUid,
      );

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="College access"
          title="Choose your college"
          description="One canonical account can belong to multiple colleges. Choose the membership you want to use for this session."
        />
        <MembershipChooser
          memberships={memberships}
        />
      </div>
    );
  }

  return (
    <MembershipDashboard
      context={context}
    />
  );
}
