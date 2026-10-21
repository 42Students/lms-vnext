import { and, asc, desc, eq, gte, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import { getDb } from "@/db/client";
import {activityEvents} from "@/db/schema/activity";
import {placementTpoJobTypes} from "@/db/schema/tpo-configuration";
import {TPO_BUILTIN_JOB_TYPES} from "./tpo-builtin-job-types";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import {deliverRecordedJobApplicantsPlacementEvent} from "./learner-placement-event-delivery";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  placementCompanyRelationships,
  placementCompanies,
  placementApplications,
  placementOffers,
  placementOfferStatusHistory,
  placementDebarmentDriveEvents,
  placementDebarments,
  placementJobs,
  placementJobRoleOptions,
  placementJobRounds,
  placementJobEligibilityPolicies,
  placementSeasons,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import {isLegacyAssessmentDeadlineAfterApplication} from "./placement-legacy-posting-model";
import { isDebarmentActive } from "./batch-registration-policy";
import {notifyEligiblePublishedDrive} from "./tpo-drive-publish-effects";
import {hasSecureEmployerPortalUrl} from "./tpo-drive-lifecycle-model";
import {
  requirePlacementJobSeasonActive,
} from "./season-service";
import { requirePlacementManageScope } from "./scope";
import {
  createPlacementJobInputSchema,
  placementJobIdSchema,
  updatePlacementJobInputSchema,
  type CreatePlacementJobInput,
  type UpdatePlacementJobInput,
} from "./validation";

async function loadActiveRelationship(
  collegeId: string,
  relationshipId: string,
) {
  const [row] = await getDb()
    .select({
      relationship: placementCompanyRelationships,
      company: placementCompanies,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(
      and(
        eq(placementCompanyRelationships.id, relationshipId),
        eq(placementCompanyRelationships.collegeId, collegeId),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        isNull(placementCompanyRelationships.archivedAt),
        eq(placementCompanies.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND",
    );
  }
  return row;
}

async function loadJob(jobId: string) {
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }
  return job;
}

export type PlacementJobListOptions={
 page?:number;pageSize?:number;q?:string;
 status?:"ALL"|"DRAFT"|"PUBLISHED"|"CLOSED"|"CANCELLED"|"ARCHIVED";
 sort?:"TITLE_ASC"|"POSTED_DESC"|"POSTED_ASC"|"DEADLINE_ASC"|"DEADLINE_DESC";
 applicationMode?:"ALL"|"INTERNAL"|"HYBRID"|"EXTERNAL_ONLY";
};
/** The original separate draft/active/deleted flags are views over the
 * canonical vNext lifecycle. A lapsed deadline does not mutate job status. */
export function projectLegacyPlacementJobStatus(job:{
 status:string;archivedAt:Date|null;publishedAt:Date|null;createdAt:Date;
 applicationDeadline:Date|null;
},now=new Date()){
 const archived=job.status==="ARCHIVED"||job.archivedAt!==null;
 const expired=job.applicationDeadline!==null&&job.applicationDeadline<=now;
 const active=job.status==="PUBLISHED"&&!archived;
 return {isDraft:job.status==="DRAFT",isActive:active,isDeleted:archived,
  isOpenForApplications:active&&!expired,expired,
  postedDate:job.publishedAt??job.createdAt,
  applicationDeadline:job.applicationDeadline};
}
/** Canonical equivalents of the combined legacy job controller routes.
 * Route handlers continue to enforce role, tenant and origin authorization. */
export const legacyPlacementJobRouteMap={
 list:"GET /api/placements/jobs",
 create:"POST /api/placements/jobs",
 detail:"GET /api/placements/jobs/[jobId]",
 update:"PATCH /api/placements/jobs/[jobId]",
 publish:"POST /api/placements/jobs/[jobId]/tpo-lifecycle (PUBLISH)",
 close:"POST /api/placements/jobs/[jobId]/status (CLOSE)",
 tpoClose:"POST /api/placements/jobs/[jobId]/tpo-lifecycle (CLOSE)",
 cancelPreview:"GET /api/placements/tpo/jobs/[jobId]/cancel-preview",
 archive:"DELETE /api/placements/jobs/[jobId]",
 applications:"GET /api/placements/jobs/[jobId]/applications",
 tpoLifecycle:"POST /api/placements/jobs/[jobId]/tpo-lifecycle",
} as const;
function placementJobSearchPattern(value:string){
 const escaped=value.trim().slice(0,120).replace(/[%_\\]/g,"\\$&");
 return "%"+escaped+"%";
}
function legacyMilestoneDeadline(details:{
 importantDates:readonly {label:string;at:string}[];
}|null|undefined):Date|null{
 const dated=details?.importantDates.find(item=>
  /application\s*(deadline|last\s*date)|last\s*date\s*to\s*apply/i.test(item.label));
 if(!dated)return null;
 // Reject ambiguous local clock values: IST must be explicit in an imported
 // RFC3339 date, not guessed from the server's deployment timezone.
 if(!/T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(dated.at))return null;
 const parsed=new Date(dated.at);
 return Number.isNaN(parsed.getTime())?null:parsed;
}
function scopedPlacementJobPredicate(collegeId:string,options?:PlacementJobListOptions){
 const term=options?.q?.trim();
 return and(eq(placementJobs.collegeId,collegeId),
  options?.status==="ARCHIVED"?
   eq(placementJobs.status,"ARCHIVED"):isNull(placementJobs.archivedAt),
  options?.status&&options.status!=="ALL"?
   eq(placementJobs.status,options.status):undefined,
  options?.applicationMode&&options.applicationMode!=="ALL"?
   eq(placementJobs.applicationMode,options.applicationMode):undefined,
  term?or(ilike(placementJobs.title,placementJobSearchPattern(term)),
   ilike(placementCompanies.name,placementJobSearchPattern(term))):undefined,
 );
}
export async function listPlacementJobs(
  context: RequestContext,
  collegeIdInput: string,
  options?:PlacementJobListOptions,
) {
  const collegeId = createPlacementJobInputSchema.shape.collegeId.parse(
    collegeIdInput,
  );
  await requirePlacementManageScope(context, collegeId);

  const page=Number.isSafeInteger(options?.page)&&options!.page!>0?
   Math.min(10000,options!.page!):1;
  const pageSize=[10,20,50,100].includes(options?.pageSize??20)?options?.pageSize??20:20;
  const query=getDb()
    .select({
      job: placementJobs,
      company: placementCompanies,
      applicantCount:sql<number>`(select count(distinct a.membership_id)::int from placement_applications a
        where a.job_id = ${placementJobs.id} and a.status <> 'WITHDRAWN')`,
      applicationCount:sql<number>`(select count(*)::int from placement_applications a
        where a.job_id = ${placementJobs.id})`,
      companyName:placementCompanies.name,
      companyLogoUrl:sql<string|null>`case when ${placementCompanies.logoPublicUrl} like 'https://%' then ${placementCompanies.logoPublicUrl} else null end`,
      legacyStatus:sql<string>`case
        when ${placementJobs.status} = 'ARCHIVED' then 'DELETED'
        when ${placementJobs.status} = 'DRAFT' then 'DRAFT'
        when ${placementJobs.status} = 'PUBLISHED' and ${placementJobs.applicationDeadline} <= now() then 'EXPIRED'
        when ${placementJobs.status} = 'PUBLISHED' then 'OPEN'
        when ${placementJobs.status} = 'CANCELLED' then 'CANCELLED'
        else 'CLOSED' end`,
      season: {
        id: placementSeasons.id,
        name: placementSeasons.name,
        code: placementSeasons.code,
        status: placementSeasons.status,
        startDate: placementSeasons.startDate,
        endDate: placementSeasons.endDate,
      },
    })
    .from(placementJobs)
    .innerJoin(
      placementSeasons,
      eq(
        placementSeasons.id,
        placementJobs.seasonId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(scopedPlacementJobPredicate(collegeId,options));
  if(!options)return query.orderBy(desc(sql`coalesce(${placementJobs.legacyPostedAt},${placementJobs.publishedAt},${placementJobs.createdAt})`),
    desc(placementJobs.createdAt),asc(placementJobs.id));
  const ordered=options.sort==="TITLE_ASC"?
   query.orderBy(asc(placementJobs.title),asc(placementJobs.id)):
   options.sort==="POSTED_ASC"?
   query.orderBy(asc(sql`coalesce(${placementJobs.legacyPostedAt},${placementJobs.publishedAt},${placementJobs.createdAt})`),asc(placementJobs.createdAt),asc(placementJobs.id)):
   options.sort==="DEADLINE_ASC"?
   query.orderBy(asc(placementJobs.applicationDeadline),asc(placementJobs.createdAt),asc(placementJobs.id)):
   options.sort==="DEADLINE_DESC"?
   query.orderBy(desc(placementJobs.applicationDeadline),desc(placementJobs.createdAt),asc(placementJobs.id)):
   query.orderBy(desc(sql`coalesce(${placementJobs.legacyPostedAt},${placementJobs.publishedAt},${placementJobs.createdAt})`),desc(placementJobs.createdAt),asc(placementJobs.id));
  return ordered.limit(pageSize).offset((page-1)*pageSize);
}
/** Preserve old list callers; explicit pages are opt-in and always scoped
 * to the college permission before any count or search.
 */
export async function listPlacementJobsPage(
 context:RequestContext,collegeIdInput:string,options:PlacementJobListOptions={},
){
 const collegeId=createPlacementJobInputSchema.shape.collegeId.parse(collegeIdInput);
 const page=Number.isSafeInteger(options.page)&&options.page!>0?Math.min(10000,options.page!):1;
 const pageSize=[10,20,50,100].includes(options.pageSize??20)?options.pageSize??20:20;
 const scoped={...options,page,pageSize};
 const items=await listPlacementJobs(context,collegeId,scoped);
 const [total]=await getDb().select({count:sql<number>`count(*)::int`}).from(placementJobs)
  .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(scopedPlacementJobPredicate(collegeId,options));
 return {items,page,pageSize,totalCount:Number(total?.count??0),
  totalPages:Math.ceil(Number(total?.count??0)/pageSize),
  hasMore:page*pageSize<Number(total?.count??0),
  empty:items.length===0};
}

/** Resolve numeric old links or historic slugs only inside an already
 * authorized college; neither legacy ID nor slug grants access by itself. */
export async function resolveScopedPlacementJobLocator(
 context:RequestContext,collegeId:string,locator:string,
){
 await requirePlacementManageScope(context,collegeId);
 const normalized=locator.trim();
 if(!normalized||normalized.length>160)return null;
 const isLegacyId=/^[1-9][0-9]{0,9}$/.test(normalized);
 const isUuid=/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(normalized);
 const matches=isLegacyId?eq(placementJobs.legacyJobId,Number(normalized)):
  isUuid?eq(placementJobs.id,normalized):
   sql`lower(${placementJobs.legacySlug})=lower(${normalized})`;
 const [job]=await getDb().select().from(placementJobs)
  .where(and(eq(placementJobs.collegeId,collegeId),matches)).limit(1);
 return job??null;
}
/** Case-insensitive exists used for duplicate-title guidance in create/edit.
 * A matching title is only a warning; multiple drives at one employer are legal. */
export async function placementJobTitleExists(
 context:RequestContext,collegeId:string,title:string,excludeJobId?:string,
){
 await requirePlacementManageScope(context,collegeId);
 const term=title.trim();
 if(!term||term.length>200)return false;
 const [match]=await getDb().select({id:placementJobs.id}).from(placementJobs)
  .where(and(eq(placementJobs.collegeId,collegeId),
    isNull(placementJobs.archivedAt),
    sql`lower(trim(${placementJobs.title}))=lower(${term})`,
    excludeJobId?ne(placementJobs.id,excludeJobId):undefined)).limit(1);
 return Boolean(match);
}
export async function getPlacementJobCatalogueStats(
 context:RequestContext,collegeId:string,
){
 await requirePlacementManageScope(context,collegeId);
 const [row]=await getDb().select({
  total:sql<number>`count(*)::int`,
  drafts:sql<number>`count(*) filter (where ${placementJobs.status}='DRAFT')::int`,
  published:sql<number>`count(*) filter (where ${placementJobs.status}='PUBLISHED' and
    (${placementJobs.applicationDeadline} is null or ${placementJobs.applicationDeadline}>now()))::int`,
  expired:sql<number>`count(*) filter (where ${placementJobs.status}='PUBLISHED' and
    ${placementJobs.applicationDeadline}<=now())::int`,
  closed:sql<number>`count(*) filter (where ${placementJobs.status}='CLOSED')::int`,
  archived:sql<number>`count(*) filter (where ${placementJobs.status}='ARCHIVED')::int`,
 }).from(placementJobs).where(eq(placementJobs.collegeId,collegeId));
 return row??{total:0,drafts:0,published:0,expired:0,closed:0,archived:0};
}
/** Uses the canonical company relationship and a persisted saved-actor event.
 * Only a trusted public HTTPS logo may be rendered; object paths need a
 * separately scoped signed URL and must never be sent as public URLs. */
export async function getPlacementJobLegacyDetail(
 context:RequestContext,rawJobId:string,
){
 const job=await getPlacementJob(context,rawJobId);
 const [company]=await getDb().select({
  name:placementCompanies.name,
  logoPublicUrl:placementCompanies.logoPublicUrl,
 }).from(placementCompanyRelationships)
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .where(and(eq(placementCompanyRelationships.id,job.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,job.collegeId))).limit(1);
 const [latest]=await getDb().select({
  actorUserId:activityEvents.actorUserId,
  occurredAt:activityEvents.occurredAt,
  actorName:users.displayName,
 }).from(activityEvents)
 .leftJoin(users,eq(users.id,activityEvents.actorUserId))
 .where(and(eq(activityEvents.subjectType,"placement_job"),
   eq(activityEvents.subjectId,job.id),
   inArray(activityEvents.eventType,["placements.job.draft_created","placements.job.draft_updated",
    "placements.job.published_edited"])))
 .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
 const url=company?.logoPublicUrl;
 const logoUrl=url&&/^https:\/\//i.test(url)?url:null;
 return {...job,companyName:company?.name??"Company unavailable",
  companyLogoUrl:logoUrl,
  companyInitials:(company?.name??"?").trim().slice(0,2).toUpperCase(),
  legacyStatus:projectLegacyPlacementJobStatus(job),
  lastSavedByUserId:latest?.actorUserId??job.createdByUserId,
  lastSavedByName:latest?.actorName??null,
  lastSavedAt:job.updatedAt,
  lastAuditedAt:latest?.occurredAt??null,
  // Imported posting milestones remain a display source only; canonical
  // applicationDeadline controls eligibility, even when the old label differs.
  milestones:job.legacyPostingDetails?.importantDates??[],
  recordedOutside:job.recordedOutside};
}
export async function getPlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );
  return job;
}

/** Read-only impact preview for destructive actions. Callers must obtain
 * user confirmation; this does not change write authorization or status.
 */
export async function getPlacementJobStopImpact(context:RequestContext,jobIdInput:string){
 const job=await getPlacementJob(context,jobIdInput);
 const db=getDb();
 const [[applications],[heldOffers],[bookedSlots],[rounds]]=await Promise.all([
  db.select({count:sql<number>`count(*)::int`}).from(placementApplications)
   .where(eq(placementApplications.jobId,job.id)),
  db.select({count:sql<number>`count(*)::int`}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(and(eq(placementApplications.jobId,job.id),
    inArray(placementOffers.status,["ISSUED","ACCEPTED"]))),
  db.select({count:sql<number>`count(*)::int`}).from(placementRoundCandidateSlots)
   .where(and(eq(placementRoundCandidateSlots.jobId,job.id),
    eq(placementRoundCandidateSlots.status,"BOOKED"))),
  db.select({count:sql<number>`count(*)::int`}).from(placementJobRounds)
   .where(and(eq(placementJobRounds.jobId,job.id),ne(placementJobRounds.status,"CANCELLED"))),
 ]);
 return {jobId:job.id,status:job.status,
  applications:Number(applications?.count??0),
  activeOffers:Number(heldOffers?.count??0),
  bookedInterviews:Number(bookedSlots?.count??0),
  scheduledRounds:Number(rounds?.count??0),
  jobDescriptionRetained:Boolean(job.jobDescriptionObjectPath),
  legacyDescriptionLinkRequiresReview:Boolean(job.legacyJobDescriptionUrl),
  cancelRequiresNotification:true,archiveKeepsHistory:true};
}

export async function createPlacementJob(
  context: RequestContext,
  rawInput: CreatePlacementJobInput,
) {
  const input = createPlacementJobInputSchema.parse(rawInput);
  if (!can(context, "placements.manage", { collegeId: input.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: input.collegeId });
  await requirePlacementManageScope(context, input.collegeId);
  const db = getDb();
  return db.transaction(async (tx) => {
    // Lock both relationship and company while the draft is inserted.
    // A concurrently revoked company link must not be used by a new drive.
    const [activeCompany]=await tx.select({id:placementCompanyRelationships.id})
      .from(placementCompanyRelationships)
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .where(and(
       eq(placementCompanyRelationships.id,input.companyRelationshipId),
       eq(placementCompanyRelationships.collegeId,input.collegeId),
       eq(placementCompanyRelationships.status,"ACTIVE"),
       isNull(placementCompanyRelationships.archivedAt),
       eq(placementCompanies.status,"ACTIVE"),
      )).for("share").limit(1);
    if(!activeCompany)
      throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    const seasonConditions = [
      eq(
        placementSeasons.collegeId,
        input.collegeId,
      ),
      eq(
        placementSeasons.status,
        "ACTIVE",
      ),
    ];
    if (input.seasonId) {
      seasonConditions.push(
        eq(
          placementSeasons.id,
          input.seasonId,
        ),
      );
    }

    const [season] = await tx
      .select({
        id: placementSeasons.id,
      })
      .from(placementSeasons)
      .where(and(...seasonConditions))
      .for("update")
      .limit(1);

    if (!season) {
      throw new PlacementsServiceError(
        input.seasonId
          ? "PLACEMENT_SEASON_NOT_ACTIVE"
          : "PLACEMENT_SEASON_REQUIRED",
      );
    }

    const fallbackType = input.employmentType === "INTERNSHIP" ? "Internship"
      : input.employmentType === "CONTRACT" ? "Contract" : "Full-time";
    const requestedLabel = (input.jobTypeLabel ?? fallbackType).trim().replace(/\s+/g, " ");
    const builtin = TPO_BUILTIN_JOB_TYPES.find(type => type.label.toLowerCase() === requestedLabel.toLowerCase());
    const [configured] = await tx.select({label:placementTpoJobTypes.label,
      active:placementTpoJobTypes.active,countsAsPlaced:placementTpoJobTypes.countsAsPlaced})
      .from(placementTpoJobTypes).where(and(eq(placementTpoJobTypes.collegeId,input.collegeId),
        sql`lower(${placementTpoJobTypes.label}) = lower(${requestedLabel}::text)`)).limit(1);
    if ((!builtin && !configured) || configured?.active === false)
      throw new PlacementsServiceError("PLACEMENT_JOB_TYPE_INVALID");
    const jobTypeLabel = builtin?.label ?? configured!.label;
    const countsAsPlaced = builtin?.countsAsPlaced ?? configured?.countsAsPlaced ?? true;
    const [job] = await tx
      .insert(placementJobs)
      .values({
        collegeId: input.collegeId,
        seasonId: season.id,
        companyRelationshipId:
          input.companyRelationshipId,
        title: input.title,
        description: input.description,
        legacyPostingDetails:input.legacyPostingDetails??null,
        employmentType:
          input.employmentType,
        jobTypeLabel,
        countsAsPlaced,
        workMode: input.workMode,
        locations: input.locations,
        openings: input.openings ?? null,
        minimumAnnualCtcInr:
          input.minimumAnnualCtcInr ?? null,
        maximumAnnualCtcInr:
          input.maximumAnnualCtcInr ?? null,
        isDream: input.isDream,
        fixedCtcLpa:input.fixedCtcLpa==null?null:input.fixedCtcLpa.toFixed(2),
        variableCtcLpa:input.variableCtcLpa==null?null:input.variableCtcLpa.toFixed(2),
        stipendPerMonthInr:input.stipendPerMonthInr??null,
        applicationMode:
          input.applicationMode,
        externalApplicationUrl:
          input.externalApplicationUrl ?? null,
        applicationDeadline:input.applicationDeadline===undefined?
          legacyMilestoneDeadline(input.legacyPostingDetails):input.applicationDeadline,
        legacyScreeningVersion:1,
        createdByUserId:
          context.user.id,
      })
      .returning();

    await tx
      .insert(placementJobRoleOptions)
      .values({
        jobId: job.id,
        title: job.title,
        employmentType:
          job.employmentType,
        workMode: job.workMode,
        locations: job.locations,
        openings: job.openings,
        minimumAnnualCtcInr:
          job.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          job.maximumAnnualCtcInr,
        isPrimary: true,
      });

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_DRAFT_CREATED,
      collegeId: input.collegeId,
      subjectType: "placement_job",
      subjectId: job.id,
      subjectLabel: job.title,
      summary: "Placement drive draft created",
      metadata: {
        seasonId: season.id,
        companyRelationshipId: input.companyRelationshipId,
        draftStatus: job.status,
      },
      groupKey: "placement-jobs:" + input.collegeId,
    });

    return job;
  });
}

export async function updatePlacementJob(
  context: RequestContext,
  jobIdInput: string,
  rawInput: UpdatePlacementJobInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input = updatePlacementJobInputSchema.parse(rawInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  await requirePlacementJobSeasonActive(
    current,
  );

  if (current.status !== "DRAFT") {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  }

  const nextMinimum =
    input.minimumAnnualCtcInr === undefined
      ? current.minimumAnnualCtcInr
      : input.minimumAnnualCtcInr;
  const nextMaximum =
    input.maximumAnnualCtcInr === undefined
      ? current.maximumAnnualCtcInr
      : input.maximumAnnualCtcInr;
  if (
    nextMinimum != null &&
    nextMaximum != null &&
    nextMaximum < nextMinimum
  ) {
    throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_CTC_RANGE");
  }

  const nextMode = input.applicationMode ?? current.applicationMode;
  const nextExternalUrl =
    input.externalApplicationUrl === undefined
      ? current.externalApplicationUrl
      : input.externalApplicationUrl;
  if (nextMode !== "INTERNAL" && !nextExternalUrl) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_EXTERNAL_URL_REQUIRED",
    );
  }

  const legacyAssessmentDeadline=input.legacyPostingDetails===undefined
    ?current.legacyPostingDetails?.assessmentDeadline
    :input.legacyPostingDetails?.assessmentDeadline;
  const milestoneDeadline=input.legacyPostingDetails===undefined?null:
    legacyMilestoneDeadline(input.legacyPostingDetails);
  const nextApplicationDeadline=input.applicationDeadline===undefined
    ?milestoneDeadline??current.applicationDeadline:input.applicationDeadline;
  if(!isLegacyAssessmentDeadlineAfterApplication(legacyAssessmentDeadline,nextApplicationDeadline))
    throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_DEADLINE");
  const db = getDb();
  return db.transaction(async (tx) => {
    // Preflight data is advisory: serialize draft updates and reject a
    // concurrent save or publish rather than overwriting another editor.
    const [live]=await tx.select({
      status:placementJobs.status,updatedAt:placementJobs.updatedAt,
      version:placementJobs.version,
    }).from(placementJobs).where(and(
      eq(placementJobs.id,jobId),eq(placementJobs.collegeId,current.collegeId),
    )).for("update").limit(1);
    if(!live||live.status!=="DRAFT")
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
    if(live.updatedAt.getTime()!==current.updatedAt.getTime())
      throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
    const nextTitle =
      input.title ?? current.title;
    const [duplicateRole] = await tx
      .select({
        id: placementJobRoleOptions.id,
      })
      .from(placementJobRoleOptions)
      .where(
        and(
          eq(
            placementJobRoleOptions.jobId,
            jobId,
          ),
          eq(
            placementJobRoleOptions.status,
            "ACTIVE",
          ),
          eq(
            placementJobRoleOptions.title,
            nextTitle,
          ),
          eq(
            placementJobRoleOptions.isPrimary,
            false,
          ),
        ),
      )
      .limit(1);

    if (duplicateRole) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_DUPLICATE",
      );
    }

    // A historical hidden label may remain unchanged on this draft, but a new
    // label must still be one of the college's active choices.
    let nextTypeLabel: string | undefined;
    let nextCountsAsPlaced: boolean | undefined;
    if (input.jobTypeLabel !== undefined) {
      const requested = input.jobTypeLabel.trim().replace(/\s+/g, " ");
      if (current.jobTypeLabel?.toLowerCase() === requested.toLowerCase()) {
        nextTypeLabel = current.jobTypeLabel;
        nextCountsAsPlaced = current.countsAsPlaced;
      } else {
        const builtin = TPO_BUILTIN_JOB_TYPES.find(
          type => type.label.toLowerCase() === requested.toLowerCase(),
        );
        const [configured] = await tx.select({
          label:placementTpoJobTypes.label,
          active:placementTpoJobTypes.active,
          countsAsPlaced:placementTpoJobTypes.countsAsPlaced,
        }).from(placementTpoJobTypes).where(and(
          eq(placementTpoJobTypes.collegeId,current.collegeId),
          sql`lower(${placementTpoJobTypes.label}) = lower(${requested}::text)`,
        )).limit(1);
        if ((!builtin && !configured) || configured?.active === false)
          throw new PlacementsServiceError("PLACEMENT_JOB_TYPE_INVALID");
        nextTypeLabel = builtin?.label ?? configured!.label;
        nextCountsAsPlaced = builtin?.countsAsPlaced ?? configured?.countsAsPlaced ?? true;
      }
    }
    const [updated] = await tx
      .update(placementJobs)
      .set({
        ...input,
        applicationDeadline:input.applicationDeadline===undefined&&milestoneDeadline!==null?
          milestoneDeadline:input.applicationDeadline,
        jobTypeLabel:nextTypeLabel,
        countsAsPlaced:nextCountsAsPlaced,
        fixedCtcLpa:input.fixedCtcLpa===undefined?undefined:
          input.fixedCtcLpa===null?null:input.fixedCtcLpa.toFixed(2),
        variableCtcLpa:input.variableCtcLpa===undefined?undefined:
          input.variableCtcLpa===null?null:input.variableCtcLpa.toFixed(2),
        version:sql`${placementJobs.version}+1`,
        updatedAt: sql`greatest(clock_timestamp(), date_trunc('milliseconds', ${placementJobs.updatedAt}) + interval '1 millisecond')`,
      })
      .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,current.collegeId),
        eq(placementJobs.status,"DRAFT"),
        eq(placementJobs.version,live.version),
        sql`date_trunc('milliseconds', ${placementJobs.updatedAt})=${current.updatedAt.toISOString()}::timestamptz`,
      ))
      .returning();
    if(!updated)throw new PlacementsServiceError("PLACEMENT_JOB_STALE");

    const [primaryRole] = await tx
      .update(placementJobRoleOptions)
      .set({
        title: updated.title,
        employmentType:
          updated.employmentType,
        workMode: updated.workMode,
        locations: updated.locations,
        openings: updated.openings,
        minimumAnnualCtcInr:
          updated.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          updated.maximumAnnualCtcInr,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            placementJobRoleOptions.jobId,
            jobId,
          ),
          eq(
            placementJobRoleOptions.isPrimary,
            true,
          ),
          eq(
            placementJobRoleOptions.status,
            "ACTIVE",
          ),
        ),
      )
      .returning();

    if (!primaryRole) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED",
      );
    }

    // Old LMS throttled noisy draft-save activity to once per actor/drive
    // per ten minutes. The optimistic job updatedAt/version remains the
    // precise persisted last-save timestamp, even when audit is coalesced.
    const tenMinutesAgo=new Date(Date.now()-10*60_000);
    const [recent]=await tx.select({id:activityEvents.id}).from(activityEvents)
      .where(and(eq(activityEvents.subjectType,"placement_job"),
        eq(activityEvents.subjectId,updated.id),
        eq(activityEvents.eventType,"placements.job.draft_updated"),
        eq(activityEvents.actorUserId,context.user.id),
        gte(activityEvents.occurredAt,tenMinutesAgo))).limit(1);
    if(!recent){
      await tx.insert(activityEvents).values({
        organizationId:context.membership?.organizationId??context.adminScope?.organizationId??null,
        collegeId:updated.collegeId,actorUserId:context.user.id,
        actorMembershipId:context.membership?.collegeId===updated.collegeId?
          context.membership.id:null,
        module:"PLACEMENTS",eventType:"placements.job.draft_updated",
        subjectType:"placement_job",subjectId:updated.id,
        summary:"Updated drive draft "+updated.title,
        metadata:{jobId:updated.id,version:updated.version},
        occurredAt:new Date(),
      });
    }
    return updated;
  });
}

export async function publishPlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  await requirePlacementJobSeasonActive(
    current,
  );

  if (current.status !== "DRAFT") {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE");
  }
  await loadActiveRelationship(
    current.collegeId,
    current.companyRelationshipId,
  );
  if (!hasSecureEmployerPortalUrl(current.applicationMode,current.externalApplicationUrl)) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_EXTERNAL_URL_REQUIRED",
    );
  }

  const [activeRole] = await getDb()
    .select({
      id: placementJobRoleOptions.id,
      minCtc:placementJobRoleOptions.minimumAnnualCtcInr,
      maxCtc:placementJobRoleOptions.maximumAnnualCtcInr,
    })
    .from(placementJobRoleOptions)
    .where(
      and(
        eq(
          placementJobRoleOptions.jobId,
          current.id,
        ),
        eq(
          placementJobRoleOptions.status,
          "ACTIVE",
        ),
      ),
    )
    .limit(1);

  if (!activeRole) {
    throw new PlacementsServiceError("PLACEMENT_ROLE_OPTION_REQUIRED");
  }
  if(!current.applicationDeadline||current.applicationDeadline<=new Date()||
    (current.minimumAnnualCtcInr===null&&current.maximumAnnualCtcInr===null&&
      current.stipendPerMonthInr===null&&activeRole.minCtc===null&&activeRole.maxCtc===null)){
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE");
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    // TPO-drives-42: all direct publish paths must honor the same persisted
    // evaluative-round and eligibility-policy blockers as TPO lifecycle publish.
    // Check inside the publication transaction, not against a stale form preview.
    const [lockedJob] = await tx.select({
      id: placementJobs.id,
      status: placementJobs.status,
      applicationDeadline: placementJobs.applicationDeadline,
    }).from(placementJobs).where(and(
      eq(placementJobs.id, jobId),
      eq(placementJobs.collegeId, current.collegeId),
    )).for("update").limit(1);
    if (!lockedJob || lockedJob.status !== "DRAFT" ||
      !lockedJob.applicationDeadline || lockedJob.applicationDeadline <= new Date()) {
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE");
    }
    const [rounds, policy] = await Promise.all([
      tx.select({ id: placementJobRounds.id }).from(placementJobRounds).where(and(
        eq(placementJobRounds.jobId, jobId),
        ne(placementJobRounds.kind, "TALK"),
        ne(placementJobRounds.status, "CANCELLED"),
      )).limit(1),
      tx.select({ jobId: placementJobEligibilityPolicies.jobId })
        .from(placementJobEligibilityPolicies)
        .where(eq(placementJobEligibilityPolicies.jobId, jobId)).limit(1),
    ]);
    if (!rounds.length || !policy.length) {
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE");
    }
    const now = new Date();
    const [published] = await tx
      .update(placementJobs)
      .set({
        status: "PUBLISHED",
        version:sql`${placementJobs.version}+1`,
        publishedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(placementJobs.id, jobId),
          eq(
            placementJobs.status,
            "DRAFT",
          ),
        ),
      )
      .returning();

    if (!published) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOB_NOT_PUBLISHABLE",
      );
    }

    // P-S1-08: A debarment measured in subsequent drives counts at
    // publication, whether or not the excluded learner ever applies.
    // The registered DB08 trigger increments drives_counted and appends
    // immutable history only for a newly inserted (debarment, job) pair.
    const publishedEvent = await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
        collegeId: published.collegeId,
        subjectType: "placement_job",
        subjectId: published.id,
        subjectLabel: published.title,
        summary:
          `${published.title} published`,
        metadata: {
          seasonId: published.seasonId,
          companyRelationshipId:
            published.companyRelationshipId,
        },
        groupKey:
          `placement-job:${published.id}`,
        dedupeKey:
          `placement-job:${published.id}:published`,
      },
    );

    // TPO-drives-46: deliver to the eligible audience before a newly published
    // drive advances drive-count debarments. Use the immutable activity event ID.
    await notifyEligiblePublishedDrive(tx,context,published,publishedEvent.id);
    const localDateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const datePart = (type: string) =>
      localDateParts.find((part) => part.type === type)?.value ?? "";
    const collegeToday = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
    const countableDebarments = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.collegeId, published.collegeId),
        isNull(placementDebarments.liftedAt),
      ))
      .for("update");
    for (const debarment of countableDebarments) {
      // Date-based bans are governed by calendar date, not drive count.
      if (debarment.untilDate !== null || debarment.untilDrives === null ||
          !isDebarmentActive(debarment, collegeToday)) continue;
      await tx.insert(placementDebarmentDriveEvents).values({
        debarmentId: debarment.id,
        jobId: published.id,
        recordedByUserId: context.user.id,
      }).onConflictDoNothing();
    }

    return published;
  });
}

type PlacementTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** P-S2-12 / D11: closing a drive revokes only still-actionable letters. */
export function mustWithdrawPendingOfferOnDriveStop(status: string): boolean {
  return status === "ISSUED";
}

async function withdrawJobIssuedOffers(
  tx: PlacementTx, jobId: string, actorUserId: string, now: Date,
): Promise<number> {
  const offers = await tx.select({id:placementOffers.id,status:placementOffers.status})
    .from(placementOffers)
    .innerJoin(placementApplications,
      eq(placementApplications.id,placementOffers.applicationId))
    .where(and(eq(placementApplications.jobId,jobId),
      eq(placementOffers.status,"ISSUED"))).for("update");
  for (const offer of offers) {
    if (!mustWithdrawPendingOfferOnDriveStop(offer.status)) continue;
    await tx.update(placementOffers).set({
      status:"WITHDRAWN",withdrawnByUserId:actorUserId,
      withdrawnAt:now,updatedAt:now,
    }).where(and(eq(placementOffers.id,offer.id),
      eq(placementOffers.status,"ISSUED")));
    await tx.insert(placementOfferStatusHistory).values({
      offerId:offer.id,fromStatus:"ISSUED",toStatus:"WITHDRAWN",
      actorUserId,
    });
  }
  return offers.length;
}

export async function closePlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  // Closing a published drive remains available after the placement season
  // ends; otherwise unreconciled applications/offers can be stranded.
  if (current.status !== "PUBLISHED") {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const now = new Date();
    const [closed] = await tx
      .update(placementJobs)
      .set({
        status: "CLOSED",
        version:sql`${placementJobs.version}+1`,
        closedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(placementJobs.id, jobId),
          eq(
            placementJobs.status,
            "PUBLISHED",
          ),
        ),
      )
      .returning();

    if (!closed) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOB_NOT_CLOSABLE",
      );
    }

    // This direct close path predates staged company selections. A pending
    // SELECTED/VERIFIED row must not be silently stranded under CLOSED.
    // The job UPDATE holds the row lock, serializing a concurrent selection
    // record/verify with this check and rollback.
    const [unreleasedSelection] = await tx.select({id:placementDriveSelections.id})
      .from(placementDriveSelections).where(and(
        eq(placementDriveSelections.jobId,closed.id),
        inArray(placementDriveSelections.status,["SELECTED","VERIFIED"]),
      )).limit(1);
    if(unreleasedSelection)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");

    await withdrawJobIssuedOffers(tx, closed.id, context.user.id, now);
    const closedEvent=await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CLOSED,
        collegeId: closed.collegeId,
        subjectType: "placement_job",
        subjectId: closed.id,
        subjectLabel: closed.title,
        summary: `${closed.title} closed`,
        metadata: {
          seasonId: closed.seasonId,
        },
        groupKey:
          `placement-job:${closed.id}`,
        dedupeKey:
          `placement-job:${closed.id}:closed`,
      },
    );
    await deliverRecordedJobApplicantsPlacementEvent(tx,{
      eventId:closedEvent.id,collegeId:closed.collegeId,jobId:closed.id,
      kind:"DRIVE_CLOSED",subject:closed.title,
    });

    return closed;
  });
}

/** P-S2-12: cancelled drives cease accepting applications and pending offers. */
export function canCancelPublishedPlacementJob(status: string): boolean {
  return status === "PUBLISHED";
}

export async function cancelPlacementJob(context: RequestContext, jobIdInput: string) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);
  if (!canCancelPublishedPlacementJob(current.status)) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  }
  return getDb().transaction(async tx => {
    const now = new Date();
    const [cancelled] = await tx.update(placementJobs).set({
      status:"CANCELLED",closedAt:now,updatedAt:now,
      version:sql`${placementJobs.version}+1`,
    }).where(and(eq(placementJobs.id,jobId),
      eq(placementJobs.status,"PUBLISHED"))).returning();
    if (!cancelled) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
    await withdrawJobIssuedOffers(tx,jobId,context.user.id,now);
    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CANCELLED,
      collegeId:cancelled.collegeId,subjectType:"placement_job",
      subjectId:cancelled.id,subjectLabel:cancelled.title,
      summary:cancelled.title+" cancelled",
      metadata:{jobId:cancelled.id},
      groupKey:"placement-job:"+cancelled.id,
      dedupeKey:"placement-job:"+cancelled.id+":cancelled",
    });
    await deliverRecordedJobApplicantsPlacementEvent(tx,{
      eventId:event.id,collegeId:cancelled.collegeId,jobId:cancelled.id,
      kind:"DRIVE_CANCELLED",subject:cancelled.title,
    });
    return cancelled;
  });
}

/** Legacy bulk close is intentionally per-job: one failure does not roll
 * back other independently authorized college jobs or send duplicate notices.
 * Reopening CLOSED is not an implicit legacy isActive toggle: terminal
 * outcomes require the separate TPO lifecycle preflight and currently block it. */
export async function bulkChangePlacementJobVisibility(
 context:RequestContext,collegeIdInput:string,rawJobIds:readonly string[],
 action:"CLOSE"|"OPEN",
){
 const collegeId=createPlacementJobInputSchema.shape.collegeId.parse(collegeIdInput);
 await requirePlacementManageScope(context,collegeId);
 if(rawJobIds.length===0||rawJobIds.length>100)
  throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
 const ids=[...new Set(rawJobIds.map(id=>placementJobIdSchema.parse(id)))];
 const updated:string[]=[];
 const skipped:Array<{jobId:string;reason:string}>=[];
 const failed:Array<{jobId:string;reason:string}>=[];
 for(const jobId of ids){
  try{
   const job=await getPlacementJob(context,jobId);
   if(job.collegeId!==collegeId)
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
   if(action==="OPEN"){
    // CLOSED is terminal in the configured vNext lifecycle; a blind toggle
    // would resurrect expired drives and change learner eligibility.
    skipped.push({jobId,reason:job.status==="PUBLISHED"?
      "Already open":"Reopening requires an approved lifecycle review"});
   }else if(job.status!=="PUBLISHED"){
    skipped.push({jobId,reason:"Drive is not open"});
   }else{
    await closePlacementJob(context,jobId);
    updated.push(jobId);
   }
  }catch(error){
   failed.push({jobId,reason:error instanceof PlacementsServiceError?
     error.code:"Could not update drive"});
  }
 }
 return {updatedCount:updated.length,skippedCount:skipped.length,
  failedCount:failed.length,updated,skipped,failed};
}

/** Race-safe, bounded candidate sweep. A scheduled runner must use a
 * persisted-authorized college context; a failed job never aborts later jobs.
 * Per-job audit explicitly distinguishes automatic deadline closure from a
 * staff-initiated Close and notification is committed with the state. */
export async function expirePublishedPlacementJobs(
 context:RequestContext,collegeIdInput:string,limit=100,
){
 const collegeId=createPlacementJobInputSchema.shape.collegeId.parse(collegeIdInput);
 await requirePlacementManageScope(context,collegeId);
 const cap=Number.isSafeInteger(limit)?Math.max(1,Math.min(100,limit)):100;
 const now=new Date();
 const candidates=await getDb().select({id:placementJobs.id}).from(placementJobs)
  .where(and(eq(placementJobs.collegeId,collegeId),
    eq(placementJobs.status,"PUBLISHED"),
    sql`${placementJobs.applicationDeadline} <= ${now}`))
  .orderBy(asc(placementJobs.applicationDeadline),asc(placementJobs.id))
  .limit(cap);
 const closed:string[]=[];
 const failed:Array<{jobId:string;reason:string}>=[];
 const skipped:string[]=[];
 for(const candidate of candidates){
  try{
   const result=await getDb().transaction(async tx=>{
    const timestamp=new Date();
    const [job]=await tx.update(placementJobs).set({
      status:"CLOSED",closedAt:timestamp,updatedAt:timestamp,
      version:sql`${placementJobs.version}+1`,
    }).where(and(eq(placementJobs.id,candidate.id),
      eq(placementJobs.collegeId,collegeId),
      eq(placementJobs.status,"PUBLISHED"),
      sql`${placementJobs.applicationDeadline} <= ${timestamp}`))
    .returning();
    if(!job)return null; // another request closed/extended it
    const [pending]=await tx.select({id:placementDriveSelections.id})
      .from(placementDriveSelections)
      .where(and(eq(placementDriveSelections.jobId,job.id),
        inArray(placementDriveSelections.status,["SELECTED","VERIFIED"])))
      .limit(1);
    if(pending)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
    await withdrawJobIssuedOffers(tx,job.id,context.user.id,timestamp);
    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CLOSED,
      collegeId:job.collegeId,subjectType:"placement_job",
      subjectId:job.id,subjectLabel:job.title,
      summary:job.title+" auto-expired",
      metadata:{source:"AUTO_EXPIRY",deadline:job.applicationDeadline?.toISOString()??null},
      groupKey:"placement-job:"+job.id,
      dedupeKey:"placement-job:"+job.id+":closed",
    });
    await deliverRecordedJobApplicantsPlacementEvent(tx,{
      eventId:event.id,collegeId:job.collegeId,jobId:job.id,
      kind:"DRIVE_CLOSED",subject:job.title,
    });
    return job.id;
   });
   if(result)closed.push(result);else skipped.push(candidate.id);
  }catch(error){
   failed.push({jobId:candidate.id,reason:error instanceof PlacementsServiceError?
    error.code:"Automatic expiry failed"});
  }
 }
 return {scanned:candidates.length,deactivated:closed.length,closed,
  skipped,failed,summary:"Job auto-expiry complete: "+
   closed.length+" jobs deactivated"};
}

export async function archivePlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  if (current.status === "PUBLISHED") {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_CLOSE_BEFORE_ARCHIVE",
    );
  }
  if (current.status === "ARCHIVED") return current;

  return getDb().transaction(async tx => {
    const [locked] = await tx.select({status:placementJobs.status})
      .from(placementJobs).where(eq(placementJobs.id,jobId)).for("update").limit(1);
    if (!locked || locked.status === "PUBLISHED") {
      throw new PlacementsServiceError("PLACEMENT_JOB_CLOSE_BEFORE_ARCHIVE");
    }
    if (locked.status === "ARCHIVED") return current;
    const now = new Date();
    await withdrawJobIssuedOffers(tx,jobId,context.user.id,now);
    const [archived] = await tx.update(placementJobs)
      .set({status:"ARCHIVED",archivedAt:now,updatedAt:now,
        version:sql`${placementJobs.version}+1`})
      .where(and(eq(placementJobs.id,jobId),eq(placementJobs.status,locked.status)))
      .returning();
    return archived;
  });
}
