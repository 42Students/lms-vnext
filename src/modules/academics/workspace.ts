import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listDepartments } from "@/modules/departments/service";
import { listAcademicPeriods } from "./period-service";
import { listPrograms } from "./program-service";
import { listCohorts } from "./cohort-service";
import { listSections } from "./section-service";

export async function getAcademicsWorkspace(
  context: RequestContext,
  collegeId: string,
) {
  const [departments, periods, programs] =
    await Promise.all([
      listDepartments(context, collegeId),
      listAcademicPeriods(context, collegeId),
      listPrograms(context, collegeId),
    ]);

  const cohortGroups = await Promise.all(
    programs.map(async (program) => ({
      program,
      cohorts: await listCohorts(
        context,
        program.id,
      ),
    })),
  );

  const cohorts = cohortGroups.flatMap(
    ({ program, cohorts: items }) =>
      items.map((cohort) => ({
        ...cohort,
        programName: program.name,
        programCode: program.code,
      })),
  );

  const sectionGroups = await Promise.all(
    cohorts.map(async (cohort) => ({
      cohort,
      sections: await listSections(
        context,
        cohort.id,
      ),
    })),
  );

  const periodById = new Map(
    periods.map((period) => [
      period.id,
      period,
    ]),
  );

  const sections = sectionGroups.flatMap(
    ({ cohort, sections: items }) =>
      items.map((section) => ({
        ...section,
        cohortName: cohort.name,
        cohortCode: cohort.code,
        programId: cohort.programId,
        programName: cohort.programName,
        academicPeriodName:
          periodById.get(
            section.academicPeriodId,
          )?.name ?? "Unknown period",
        academicPeriodCode:
          periodById.get(
            section.academicPeriodId,
          )?.code ?? "—",
      })),
  );

  return {
    departments,
    periods,
    programs,
    cohorts,
    sections,
  };
}
