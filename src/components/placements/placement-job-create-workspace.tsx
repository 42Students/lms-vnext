import Link from "next/link";
import {and,desc,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
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

  // TPO-drives-25: one college-scoped aggregate, never one query per company.
  const memoryRows=await getDb().select({
    relationshipId:placementJobs.companyRelationshipId,
    pastDrives:sql<number>`count(*)::int`,
    joinedLearners:sql<number>`(select count(*) from placement_joining_outcomes joined
      join placement_offers offer on offer.id=joined.offer_id
      join placement_applications application on application.id=offer.application_id
      join placement_jobs job on job.id=application.job_id
      where job.college_id=${collegeId} and job.company_relationship_id=${placementJobs.companyRelationshipId}
      and joined.status='JOINED')::int`,
    lastDriveAt:sql<Date>`max(${placementJobs.createdAt})`,
    recentRoles:sql<string[]>`(array_agg(${placementJobs.title} order by ${placementJobs.createdAt} desc))[1:3]`,
  }).from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
    isNull(placementJobs.archivedAt)))
    .groupBy(placementJobs.companyRelationshipId);
  const memoryByRelationship=new Map(memoryRows.map(row=>[row.relationshipId,row]));
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
            isTrusted: company.isTrusted,
            memory:memoryByRelationship.get(company.relationshipId)??null,
          }),
        )}
      />
    </div>
  );
}
