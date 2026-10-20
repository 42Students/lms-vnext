import { PageBackLink } from "@/components/ui/page-back-link";
import { notFound } from "next/navigation";
import { ZodError } from "zod";
import { AcademicsServiceError } from "@/modules/academics/errors";
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
  eyebrow?: string;
  backHref: string;
}) {
  const workspace =
    await getSectionOperationsWorkspace(
      context,
      sectionId,
    ).catch((error: unknown) => {
      if (
        error instanceof ZodError ||
        (error instanceof AcademicsServiceError &&
          error.code === "SECTION_NOT_FOUND")
      ) {
        notFound();
      }
      throw error;
    });

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-5)]">
      <PageHeader
        eyebrow={eyebrow}
        title={workspace.section.name}
        description={`${workspace.section.programName} · ${workspace.section.cohortName} · ${workspace.section.academicPeriodName}`}
        actions={<PageBackLink href={backHref} label="Back to Academics" />}
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
