import Link from "next/link";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { SectionOperations } from "./section-operations";
import { getSectionOperationsWorkspace } from "@/modules/academics/section-workspace";

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

export async function AcademicsSectionPage({
  context,
  sectionId,
  eyebrow,
  backHref,
}: {
  context: RequestContext;
  sectionId: string;
  eyebrow: string;
  backHref: string;
}) {
  const workspace =
    await getSectionOperationsWorkspace(
      context,
      sectionId,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={workspace.section.name}
        description={`${workspace.section.programName} · ${workspace.section.cohortName} · ${workspace.section.academicPeriodName}`}
        actions={
          <Link
            href={backHref}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Back to Academics
          </Link>
        }
      />
      <SectionOperations
        section={workspace.section}
        programEnrollments={workspace.programEnrollments.map(
          (row) => ({
            ...row,
            admittedAt:
              row.admittedAt.toISOString(),
            completedAt: iso(row.completedAt),
            withdrawnAt: iso(row.withdrawnAt),
          }),
        )}
        roster={workspace.roster.map((row) => ({
          ...row,
          startedAt: row.startedAt.toISOString(),
          endedAt: iso(row.endedAt),
        }))}
        facultyAssignments={workspace.facultyAssignments.map(
          (row) => ({
            ...row,
            startedAt:
              row.startedAt.toISOString(),
            endedAt: iso(row.endedAt),
          }),
        )}
        scheduleEvents={workspace.scheduleEvents.map(
          (row) => ({
            ...row,
            startsAt: row.startsAt.toISOString(),
            endsAt: row.endsAt.toISOString(),
            createdAt:
              row.createdAt.toISOString(),
            updatedAt:
              row.updatedAt.toISOString(),
          }),
        )}
        learnerChoices={workspace.learnerChoices}
        facultyChoices={workspace.facultyChoices}
        courseChoices={workspace.courseChoices}
      />
    </div>
  );
}
