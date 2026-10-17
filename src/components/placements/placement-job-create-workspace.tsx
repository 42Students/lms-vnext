import Link from "next/link";
import { PlacementJobCreateForm } from "./placement-job-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { listCohorts } from "@/modules/academics/cohort-service";
import { listPrograms } from "@/modules/academics/program-service";
import type { RequestContext } from "@/modules/identity/context";
import { listPlacementCompanies } from "@/modules/placements/company-service";
import { listPlacementSeasons } from "@/modules/placements/season-service";

export async function PlacementJobCreateWorkspace({
  context,
  collegeId,
  eyebrow,
  basePath,
  initialCompanyName = "",
}: {
  context: RequestContext;
  collegeId: string;
  eyebrow: string;
  basePath: string;
  initialCompanyName?: string;
}) {
  const [companies, programs, seasons] =
    await Promise.all([
      listPlacementCompanies(
        context,
        collegeId,
      ),
      listPrograms(
        context,
        collegeId,
      ),
      listPlacementSeasons(
        context,
        collegeId,
      ),
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

  return (
    <div className="space-y-6">
      <Link href="/tpo/placements/lifecycle" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Back to drives</Link>
      <PageHeader
        eyebrow={eyebrow}
        title="Create drive"
        description="Build the opportunity students will see"
      />
      <PlacementJobCreateForm
        collegeId={collegeId}
        activeSeason={
          seasons.find(
            (season) =>
              season.status ===
              "ACTIVE",
          ) ?? null
        }
        basePath={basePath}
        initialCompanyName={initialCompanyName}
        academicOptions={{
          programs: programs.map(
            (program) => ({
              id: program.id,
              name: program.name,
              code: program.code,
              departmentName:
                program.departmentName,
            }),
          ),
          cohorts: cohortGroups.flatMap(
            ({ program, cohorts }) =>
              cohorts
                .filter(
                  (cohort) =>
                    cohort.status !==
                    "ARCHIVED",
                )
                .map((cohort) => ({
                  id: cohort.id,
                  name: cohort.name,
                  code: cohort.code,
                  programId: program.id,
                  programName:
                    program.name,
                  status: cohort.status,
                })),
          ),
        }}
        companies={companies.map(
          (company) => ({
            relationshipId:
              company.relationshipId,
            name: company.name,
            primaryDomain:
              company.primaryDomain,
            domains:company.domains,
            otherNames:company.otherNames,
            isTrusted: company.isTrusted,
          }),
        )}
      />
    </div>
  );
}
