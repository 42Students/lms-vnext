import { Disclosure } from "@/components/ui/disclosure";
import type { ReactNode } from "react";
import Link from "next/link";
import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,sections,cohorts,programs as programsTable,departments} from "@/db/schema";
import { PlacementJobCreateForm } from "./placement-job-create-form";
import {TpoDriveClonePicker} from "./tpo-drive-clone-picker";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { listCohorts } from "@/modules/academics/cohort-service";
import { listPrograms } from "@/modules/academics/program-service";
import type { RequestContext } from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import { listPlacementCompanies } from "@/modules/placements/company-service";
import { listPlacementSeasons } from "@/modules/placements/season-service";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
import { AuthorizationError } from "@/modules/permissions/policy";

export async function PlacementJobCreateWorkspace({
  context,
  collegeId,
  eyebrow,
  basePath,
  initialCompanyName = "",
  preFormActions,
}: {
  context: RequestContext;
  collegeId: string;
  eyebrow?: string;
  basePath: string;
  initialCompanyName?: string;
  preFormActions?: ReactNode;
}) {
  // A failed supporting-list request must not erase the entire new-drive form.
  // Authorization failures are different: never render a partial authorized view.
  const support = await Promise.allSettled([
    listPlacementCompanies(context,collegeId),
    listPrograms(context,collegeId),
    listPlacementSeasons(context,collegeId),
    listPlacementJobTypeChoices(context,collegeId),
  ] as const);
  for (const result of support) {
    if (result.status==="rejected" && result.reason instanceof AuthorizationError) {
      throw result.reason;
    }
  }
  const companies = support[0].status==="fulfilled" ? support[0].value : [];
  const programs = support[1].status==="fulfilled" ? support[1].value : [];
  const seasons = support[2].status==="fulfilled" ? support[2].value : [];
  const jobTypes = support[3].status==="fulfilled" ? support[3].value : [];
  const supportLoadFailed = support.some(result=>result.status==="rejected");

  // TPO-drives-25: one college-scoped aggregate, never one query per company.
  // TPO-drives-26: only this college's completed, non-archived drives can be cloned.
  // Legacy also showed published and draft jobs in its copy list; they remain
  // visible in the full directory, but cannot be used as a clone source because
  // that would duplicate a currently recruiting cohort without a review.
  const canClone=hasMembershipRole(context,"TPO")||hasMembershipRole(context,"COLLEGE_ADMIN");
  const pastDrives=canClone
    ?await getDb().select({
      id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
      createdAt:placementJobs.createdAt,
    }).from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
      isNull(placementJobs.archivedAt),
      inArray(placementJobs.status,["CLOSED","CANCELLED"])))
     .orderBy(desc(placementJobs.createdAt)).limit(60)
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
    existingRoles:sql<Array<{jobId:string;title:string;status:string}>>`json_agg(json_build_object('jobId', ${placementJobs.id}, 'title', ${placementJobs.title}, 'status', ${placementJobs.status}) order by ${placementJobs.createdAt} desc)`,
  }).from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
    isNull(placementJobs.archivedAt)))
    .groupBy(placementJobs.companyRelationshipId);
  const memoryByRelationship=new Map(memoryRows.map(row=>[row.relationshipId,row]));
  const cohortResults = await Promise.allSettled(
    programs.map(async (program) => ({
      program,
      cohorts: await listCohorts(context,program.id),
    })),
  );
  for (const result of cohortResults) {
    if(result.status==="rejected" && result.reason instanceof AuthorizationError) {
      throw result.reason;
    }
  }
  const cohortGroups = cohortResults.flatMap(result=>
    result.status==="fulfilled" ? [result.value] : []);
  const cohortsLoadFailed = cohortResults.some(result=>result.status==="rejected");

  // One scoped query for active classes, never one request per cohort.
  const sectionRows=await getDb().select({
    id:sections.id,name:sections.name,code:sections.code,
    cohortId:cohorts.id,cohortName:cohorts.name,programId:programsTable.id,
    departmentName:departments.name,
  }).from(sections).innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programsTable,eq(programsTable.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programsTable.departmentId))
    .where(and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt),
      eq(sections.status,"ACTIVE"),eq(programsTable.status,"ACTIVE")))
    .limit(1000);

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        {...(eyebrow !== undefined ? {eyebrow} : {})}
        title="Create drive"
        description="Start from a completed drive or build a new opportunity for students."
        actions={<PageBackLink href={basePath} label="Back to Drives" />}
      />
      {supportLoadFailed || cohortsLoadFailed ? <p role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
        Some company or academic setup data could not be loaded. The available fields remain editable, but review company, season and eligibility choices before creating a drive.{" "}
        <Link href={basePath+"/new"} className="font-semibold text-primary-text underline">Retry setup data</Link>
      </p> : null}
      {preFormActions ? <div className="min-w-0">{preFormActions}</div> : null}
      {canClone?<Disclosure title="Clone a past drive" defaultOpen={pastDrives.length>0}
        className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]"
        contentClassName="min-w-0 pt-3">
        {pastDrives.length>0?<TpoDriveClonePicker collegeAdmin={!hasMembershipRole(context,"TPO")} drives={pastDrives.map(job=>({
          id:job.id,title:job.title,status:job.status,
          createdAt:job.createdAt.toISOString(),
        }))}/>:<p className="text-sm text-muted-foreground">
          No completed or cancelled drives are available to clone yet.
          Create a new drive below.
        </p>}
      </Disclosure>:null}
      <PlacementJobCreateForm
        jobTypes={jobTypes}
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
