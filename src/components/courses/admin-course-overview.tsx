import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  getAdminCourseWorkspace,
} from "@/modules/courses/admin-course-workspace";
import { AdminCourseCreatePanel } from "./admin-course-create-panel";
import {
  CourseActions,
  DeliveryActions,
  OfferingActions,
  TeachingAssignmentActions,
} from "./admin-course-actions";

type Workspace = Awaited<
  ReturnType<typeof getAdminCourseWorkspace>
>;

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p>
    </section>
  );
}

export function AdminCourseOverview({
  workspace,
}: {
  workspace: Workspace;
}) {
  const deliveryCountByOffering = new Map<
    string,
    number
  >();
  const teacherCountByDelivery = new Map<
    string,
    number
  >();

  for (const delivery of workspace.deliveries) {
    deliveryCountByOffering.set(
      delivery.offeringId,
      (deliveryCountByOffering.get(
        delivery.offeringId,
      ) ?? 0) + 1,
    );
  }

  for (const assignment of workspace.teachingAssignments) {
    teacherCountByDelivery.set(
      assignment.deliveryId,
      (teacherCountByDelivery.get(
        assignment.deliveryId,
      ) ?? 0) + 1,
    );
  }

  const courseColumns: DataTableColumn<
    Workspace["courses"][number]
  >[] = [
    {
      key: "course",
      header: "Course",
      cell: (course) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {course.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-text">
            {course.code}
          </p>
          {course.description ? (
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (course) =>
        course.departmentName,
    },
    {
      key: "status",
      header: "Status",
      cell: (course) => (
        <StatusBadge
          tone={
            course.status === "ACTIVE"
              ? "success"
              : "neutral"
          }
        >
          {course.status}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (course) => (
        <CourseActions
          course={{
            id: course.id,
            name: course.name,
            code: course.code,
            description:
              course.description,
          }}
        />
      ),
    },
  ];

  const offeringColumns: DataTableColumn<
    Workspace["offerings"][number]
  >[] = [
    {
      key: "course",
      header: "Course",
      cell: (offering) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {offering.courseName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {offering.courseCode} ·{" "}
            {offering.departmentName}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Cohort / Period",
      cell: (offering) => (
        <div>
          <p className="m-0 text-sm text-body">
            {offering.cohortName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {offering.academicPeriodName}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type / Credits",
      cell: (offering) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">
            {offering.type}
          </StatusBadge>
          <span>
            {offering.credits ?? "—"} credits
          </span>
        </div>
      ),
    },
    {
      key: "deliveries",
      header: "Sections",
      cell: (offering) =>
        deliveryCountByOffering.get(
          offering.id,
        ) ?? 0,
    },
    {
      key: "actions",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (offering) => (
        <OfferingActions
          offering={{
            id: offering.id,
            type: offering.type,
            credits: offering.credits,
            displayOrder:
              offering.displayOrder,
            courseName:
              offering.courseName,
          }}
        />
      ),
    },
  ];

  const deliveryColumns: DataTableColumn<
    Workspace["deliveries"][number]
  >[] = [
    {
      key: "course",
      header: "Course",
      cell: (delivery) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {delivery.courseName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {delivery.courseCode}
          </p>
        </div>
      ),
    },
    {
      key: "section",
      header: "Section",
      cell: (delivery) => (
        <div>
          <p className="m-0 text-sm text-body">
            {delivery.sectionName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {delivery.sectionCode}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Cohort / Period",
      cell: (delivery) => (
        <div>
          <p className="m-0 text-sm text-body">
            {delivery.cohortName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {delivery.academicPeriodName}
          </p>
        </div>
      ),
    },
    {
      key: "faculty",
      header: "Faculty",
      cell: (delivery) =>
        teacherCountByDelivery.get(
          delivery.id,
        ) ?? 0,
    },
    {
      key: "actions",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (delivery) => (
        <DeliveryActions
          delivery={{
            id: delivery.id,
            courseName:
              delivery.courseName,
            sectionName:
              delivery.sectionName,
          }}
        />
      ),
    },
  ];

  const assignmentColumns: DataTableColumn<
    Workspace["teachingAssignments"][number]
  >[] = [
    {
      key: "faculty",
      header: "Faculty",
      cell: (assignment) => (
        <p className="m-0 font-semibold text-foreground">
          {assignment.displayName ??
            "Unnamed Faculty"}
        </p>
      ),
    },
    {
      key: "course",
      header: "Course / Section",
      cell: (assignment) => (
        <div>
          <p className="m-0 text-sm text-body">
            {assignment.courseName} ·{" "}
            {assignment.courseCode}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {assignment.sectionName} ·{" "}
            {assignment.sectionCode}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (assignment) => (
        <StatusBadge
          tone={
            assignment.role === "PRIMARY"
              ? "success"
              : "info"
          }
        >
          {assignment.role.replaceAll(
            "_",
            " ",
          )}
        </StatusBadge>
      ),
    },
    {
      key: "started",
      header: "Started",
      cell: (assignment) =>
        new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
        }).format(assignment.startedAt),
    },
    {
      key: "actions",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (assignment) => (
        <TeachingAssignmentActions
          assignment={{
            id: assignment.id,
            facultyDisplayName:
              assignment.displayName ??
              "Unnamed Faculty",
            courseName:
              assignment.courseName,
            sectionName:
              assignment.sectionName,
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Courses"
          value={workspace.summary.courses}
          detail="Active Department-owned catalog entries."
        />
        <Metric
          label="Offerings"
          value={workspace.summary.offerings}
          detail="Active Cohort and Academic Period placements."
        />
        <Metric
          label="Deliveries"
          value={workspace.summary.deliveries}
          detail="Exact Section teaching boundaries."
        />
        <Metric
          label="Teaching assignments"
          value={
            workspace.summary
              .teachingAssignments
          }
          detail="Active Faculty responsibilities across deliveries."
        />
      </div>

      <AdminCourseCreatePanel
        departments={workspace.departments}
        periods={workspace.periods}
        cohorts={workspace.cohorts}
        sections={workspace.sections}
        courses={workspace.courses}
        offerings={workspace.offerings}
        deliveries={workspace.deliveries}
        faculty={workspace.faculty}
      />

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Course catalog
          </h2>
          <p className="mt-1 text-sm text-body">
            Reusable Department-owned Courses.
            Archive is dependency-safe.
          </p>
        </div>
        <DataTable
          columns={courseColumns}
          rows={workspace.courses}
          getRowKey={(course) => course.id}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Course Offerings
          </h2>
          <p className="mt-1 text-sm text-body">
            Cohort + Academic Period Course
            instances.
          </p>
        </div>
        <DataTable
          columns={offeringColumns}
          rows={workspace.offerings}
          getRowKey={(offering) =>
            offering.id
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Section Deliveries
          </h2>
          <p className="mt-1 text-sm text-body">
            Exact Offering-to-Section teaching
            boundaries.
          </p>
        </div>
        <DataTable
          columns={deliveryColumns}
          rows={workspace.deliveries}
          getRowKey={(delivery) =>
            delivery.id
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Teaching Assignments
          </h2>
          <p className="mt-1 text-sm text-body">
            Active Faculty ownership for each
            Section Delivery.
          </p>
        </div>
        <DataTable
          columns={assignmentColumns}
          rows={
            workspace.teachingAssignments
          }
          getRowKey={(assignment) =>
            assignment.id
          }
        />
      </section>
    </div>
  );
}