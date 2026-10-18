import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listDepartments } from "@/modules/departments/service";
import { listAcademicPeriods } from "./period-service";
import { listPrograms } from "./program-service";
import { listCohorts } from "./cohort-service";
import { listSections } from "./section-service";

/**
 * Large colleges can contain hundreds of batches. Running one query per
 * program/cohort in a single Promise.all can exhaust the PostgreSQL pool.
 * Bound concurrent reads while retaining all records and original order.
 */
export async function mapAcademicWorkspaceInBatches<T,U>(
  values: readonly T[],
  mapper: (value:T)=>Promise<U>,
  concurrency=8,
): Promise<U[]> {
  if(!Number.isSafeInteger(concurrency)||concurrency<1||concurrency>32)
    throw new RangeError("INVALID_ACADEMIC_WORKSPACE_CONCURRENCY");
  const result:U[]=[];
  for(let i=0;i<values.length;i+=concurrency) {
    const chunk=await Promise.all(values.slice(i,i+concurrency).map(mapper));
    result.push(...chunk);
  }
  return result;
}

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

  const cohortGroups = await mapAcademicWorkspaceInBatches(
    programs, async (program) => ({
      program,
      cohorts: await listCohorts(context, program.id),
    }),
  );

  const cohorts = cohortGroups.flatMap(
    ({ program, cohorts: items }) =>
      items.map((cohort) => ({
        ...cohort,
        programName: program.name,
        programCode: program.code,
      })),
  );

  const sectionGroups = await mapAcademicWorkspaceInBatches(
    cohorts, async (cohort) => ({
      cohort,
      sections: await listSections(context, cohort.id),
    }),
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
