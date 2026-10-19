import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { legacyAcademicStatus } from "@/modules/academics/legacy-academic-status";
import type { getAcademicsWorkspace } from "@/modules/academics/workspace";
import { AcademicsCreatePanel } from "./academics-create-panel";
import {
  AcademicPeriodActions,
  CohortActions,
  ProgramActions,
  SectionActions,
} from "./academics-actions";

type Workspace = Awaited<
  ReturnType<typeof getAcademicsWorkspace>
>;

function periodTone(
  status: Workspace["periods"][number]["status"],
) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "CLOSED":
      return "neutral" as const;
    default:
      return "warning" as const;
  }
}

function cohortTone(
  status: Workspace["cohorts"][number]["status"],
) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "COMPLETED":
      return "info" as const;
    case "ARCHIVED":
      return "neutral" as const;
    default:
      return "warning" as const;
  }
}

export function AcademicsOverview({
  collegeId,
  workspace,
  sectionBasePath,
}: {
  collegeId: string;
  workspace: Workspace;
  sectionBasePath: string;
}) {
  const programColumns: DataTableColumn<
    Workspace["programs"][number]
  >[] = [
    {
      key: "program",
      header: "Program",
      cell: (program) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {program.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-text">
            {program.code}
          </p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (program) => program.departmentName,
    },
    {
      key: "duration",
      header: "Duration",
      cell: (program) =>
        `${program.durationTerms} terms`,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (program) => (
        <ProgramActions
          program={{
            id: program.id,
            name: program.name,
            code: program.code,
            durationTerms: program.durationTerms,
          }}
        />
      ),
    },
  ];

  const periodColumns: DataTableColumn<
    Workspace["periods"][number]
  >[] = [
    {
      key: "period",
      header: "Academic period",
      cell: (period) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {period.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-text">
            {period.code}
          </p>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (period) =>
        `${period.startDate} → ${period.endDate}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (period) => (
        <StatusBadge
          tone={periodTone(period.status)}
        >
          {legacyAcademicStatus(period.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (period) => (
        <AcademicPeriodActions
          period={{
            id: period.id,
            name: period.name,
            code: period.code,
            startDate: period.startDate,
            endDate: period.endDate,
            status: period.status,
          }}
        />
      ),
    },
  ];

  const cohortColumns: DataTableColumn<
    Workspace["cohorts"][number]
  >[] = [
    {
      key: "cohort",
      header: "Cohort",
      cell: (cohort) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {cohort.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-text">
            {cohort.code}
          </p>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program",
      cell: (cohort) => cohort.programName,
    },
    {
      key: "status",
      header: "Status",
      cell: (cohort) => (
        <StatusBadge
          tone={cohortTone(cohort.status)}
        >
          {legacyAcademicStatus(cohort.status, true)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (cohort) => (
        <CohortActions
          cohort={{
            id: cohort.id,
            name: cohort.name,
            code: cohort.code,
            expectedEndPeriodId:
              cohort.expectedEndPeriodId,
            status: cohort.status,
          }}
          periods={workspace.periods.map(
            (period) => ({
              id: period.id,
              name: period.name,
              code: period.code,
            }),
          )}
        />
      ),
    },
  ];

  const sectionColumns: DataTableColumn<
    Workspace["sections"][number]
  >[] = [
    {
      key: "section",
      header: "Section",
      cell: (section) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {section.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-text">
            {section.code}
          </p>
        </div>
      ),
    },
    {
      key: "cohort",
      header: "Cohort / Program",
      cell: (section) => (
        <div>
          <p className="m-0 text-sm text-body">
            {section.cohortName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {section.programName}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      cell: (section) => (
        <div>
          <p className="m-0 text-sm text-body">
            {section.academicPeriodName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {section.academicPeriodCode}
          </p>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (section) =>
        section.capacity ?? "Unlimited",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (section) => (
        <SectionActions
          section={{
            id: section.id,
            name: section.name,
            code: section.code,
            capacity: section.capacity,
          }}
          operationsHref={`${sectionBasePath}/${section.id}`}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <AcademicsCreatePanel
        collegeId={collegeId}
        departments={workspace.departments.map(
          (department) => ({
            id: department.id,
            name: department.name,
          }),
        )}
        periods={workspace.periods.map(
          (period) => ({
            id: period.id,
            name: period.name,
            code: period.code,
          }),
        )}
        programs={workspace.programs.map(
          (program) => ({
            id: program.id,
            name: program.name,
            code: program.code,
          }),
        )}
        cohorts={workspace.cohorts
          .filter(
            (cohort) =>
              cohort.status === "PLANNED" ||
              cohort.status === "ACTIVE",
          )
          .map((cohort) => ({
            id: cohort.id,
            name: cohort.name,
            code: cohort.code,
            programName: cohort.programName,
          }))}
      />

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[var(--lms-heading)]">
            Academic periods
          </h2>
          <p className="mt-1 text-sm text-body">
            College calendar windows with explicit lifecycle.
          </p>
        </div>
        <DataTable caption="Academic periods" empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={periodColumns}
          rows={workspace.periods}
          getRowKey={(period) => period.id}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[var(--lms-heading)]">
            Programs
          </h2>
          <p className="mt-1 text-sm text-body">
            Department-owned academic programs.
          </p>
        </div>
        <DataTable caption="Academic programs" empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={programColumns}
          rows={workspace.programs}
          getRowKey={(program) => program.id}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[var(--lms-heading)]">
            Cohorts / batches
          </h2>
          <p className="mt-1 text-sm text-body">
            Program intakes with progression stored as learner history.
          </p>
        </div>
        <DataTable caption="Cohorts and batches" empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={cohortColumns}
          rows={workspace.cohorts}
          getRowKey={(cohort) => cohort.id}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[var(--lms-heading)]">
            Sections
          </h2>
          <p className="mt-1 text-sm text-body">
            Period-specific roster boundaries. Open a Section for learners, Faculty responsibilities and schedule.
          </p>
        </div>
        <DataTable caption="Academic sections" empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={sectionColumns}
          rows={workspace.sections}
          getRowKey={(section) => section.id}
        />
      </section>
    </div>
  );
}
