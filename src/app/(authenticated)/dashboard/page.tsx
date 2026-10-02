import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import { listColleges } from "@/modules/colleges/service";
import { listDepartments } from "@/modules/departments/service";
import { listOrganizations } from "@/modules/organizations/service";
import {
  listCollegePeopleWithRuntime,
} from "@/modules/people/runtime";

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
      className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary hover:bg-primary-subtle"
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

  const scopeLabel = collegeId
    ? `College scope · ${colleges[0]?.name ?? "Selected college"}`
    : context.adminScope?.organizationId
      ? `Organization scope · ${organizations[0]?.name ?? "Selected organization"}`
      : "All-platform scope";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Platform overview"
        description={`${scopeLabel}. Counts and actions follow the selected safety scope.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  );
}

async function CollegeAdminDashboard({
  context,
}: {
  context: RequestContext;
}) {
  const membership = context.membership;
  if (!membership) {
    return (
      <EmptyState
        title="Select a college"
        description="Choose an active college membership to open the College Admin workspace."
      />
    );
  }

  const [colleges, departments, people] = await Promise.all([
    listColleges(context, membership.organizationId),
    listDepartments(context, membership.collegeId),
    listCollegePeopleWithRuntime(context, {
      collegeId: membership.collegeId,
      limit: 1,
      offset: 0,
    }),
  ]);
  const college = colleges[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title={college?.name ?? "College overview"}
        description="Your operational view is restricted to the active college membership."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="College"
          value={college?.code ?? "—"}
          description={college?.name ?? "Active college"}
          href="/college"
        />
        <MetricCard
          label="Departments"
          value={departments.length}
          description="Active departments in your college."
          href="/college/departments"
        />
        <MetricCard
          label="People"
          value={people.pagination.total}
          description="Canonical memberships managed by your college."
          href="/college/people"
        />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const context = await getCurrentRequestContext();

  if (isSuperAdmin(context)) {
    return <SuperAdminDashboard context={context} />;
  }

  if (hasMembershipRole(context, "COLLEGE_ADMIN")) {
    return <CollegeAdminDashboard context={context} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core platform"
        title="Dashboard"
        description="Your canonical identity and active membership are ready."
      />
      <EmptyState
        title="Your workspace is coming with the next domain phase"
        description="Learner, Faculty, Mentor and TPO experiences will be added with Academics, Courses, Projects and Placements rather than duplicating placeholder admin workflows."
      />
    </div>
  );
}
