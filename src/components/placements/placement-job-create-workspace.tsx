import Link from "next/link";
import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,sections,cohorts,programs,departments} from "@/db/schema";
import { PlacementJobCreateForm } from "./placement-job-create-form";
import {TpoDriveCloneAction} from "./tpo-drive-clone-action";
import { PageHeader } from "@/components/ui/page-header";
import { listCohorts } from "@/modules/academics/cohort-service";
import { listPrograms } from "@/modules/academics/program-service";
import type { RequestContext } from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
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
  // TPO-drives-26: only this college's completed, non-archived drives can be cloned.
  const pastDrives=hasMembershipRole(context,"TPO")
    ?await getDb().select({
      id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
      createdAt:placementJobs.createdAt,
    }).from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
      isNull(placementJobs.archivedAt),
      inArray(placementJobs.status,["CLOSED","CANCELLED"])))
     .orderBy(desc(placementJobs.createdAt)).limit(20)
    :[];
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

  // One scoped query for active classes, never one request per cohort.
  const sectionRows=await getDb().select({
    id:sections.id,name:sections.name,code:sections.code,
    cohortId:cohorts.id,cohortName:cohorts.name,programId:programs.id,
    departmentName:departments.name,
  }).from(sections).innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt),
      eq(sections.status,"ACTIVE"),eq(programs.status,"ACTIVE")))
    .limit(1000);

  return (
    <div className="space-y-6">
      <Link href="/tpo/placements/lifecycle" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Back to drives</Link>
      <PageHeader
        eyebrow={eyebrow}
        title="Create drive"
        description="Build the opportunity students will see"
      />
      {pastDrives.length>0?<details className="rounded-xl border border-border bg-surface p-4">
        <summary className="min-h-10 cursor-pointer text-sm font-semibold text-foreground">Clone a past drive</summary>
        <p className="my-2 text-xs text-body">Shows up to 20 recent completed drives. Cloning makes a new draft; dates, learners, rounds, outcomes, offers and external links are never carried over.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pastDrives.map(job=><li key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <span className="text-sm font-semibold">{job.title} · {job.status==="CANCELLED"?"Cancelled":"Closed"}</span>
            <TpoDriveCloneAction jobId={job.id} label="Clone drive"/>
          </li>)}
        </ul>
      </details>:null}
      <PlacementJobCreateForm
        userId={context.user.id}
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
          sections:sectionRows,
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
            memory:memoryByRelationship.get(company.relationshipId)??null,
          }),
        )}
      />
    </div>
  );
}
