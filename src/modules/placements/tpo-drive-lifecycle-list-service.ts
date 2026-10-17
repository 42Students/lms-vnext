import "server-only";
import { and, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohorts, programs, departments, placementCompanies, placementCompanyRelationships, placementJobs, placementSeasons, placementRecruiterDriveRequests, placementRecruiterCollegeGrants, activityEvents, users } from "@/db/schema";
import {tpoDriveRequestDifferences,type TpoDriveRequestDifference} from "./tpo-drive-request-diff-model";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { defaultTpoDriveView, tpoDriveLifecyclePage, tpoDriveLifecycleQuerySchema } from "./tpo-drive-lifecycle-list-model";
import {tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";
import { PlacementsServiceError } from "./errors";
import { requireTpoJobActor } from "./tpo-job-write-base";

/** Tenant comes only from the authenticated TPO membership. Requests need their own persisted workflow. */
export async function getTpoDriveLifecycleList(context: RequestContext, raw: unknown, now = new Date()) {
  const member = context.membership;
  if (!member || !(hasMembershipRole(context, "TPO")||hasMembershipRole(context,"COLLEGE_ADMIN")) ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const filters = tpoDriveLifecycleQuerySchema.parse(raw);
  await requirePlacementManageScope(context, collegeId);
  const db = getDb();
  await db.transaction(async(tx)=>{await requireTpoJobActor(tx,context);},{accessMode:"read only"});
  const seasons = await db.select({ id: placementSeasons.id, name: placementSeasons.name,
    status: placementSeasons.status, startDate: placementSeasons.startDate })
    .from(placementSeasons).where(eq(placementSeasons.collegeId, collegeId))
    .orderBy(desc(placementSeasons.startDate), desc(placementSeasons.createdAt));
  // TPO-drives-20: default to all college seasons, never silently hide old drives.
  const season = filters.seasonId
    ? seasons.find((s) => s.id === filters.seasonId)
    : null;
  const owners=await db.selectDistinct({id:users.id,name:users.displayName})
    .from(placementJobs).innerJoin(users,eq(users.id,placementJobs.createdByUserId))
    .where(and(eq(placementJobs.collegeId,collegeId),isNull(placementJobs.archivedAt)))
    .orderBy(users.displayName);
  const batches=await db.select({id:cohorts.id,name:cohorts.name,programName:programs.name})
    .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(eq(departments.collegeId,collegeId))
    .orderBy(cohorts.name,cohorts.id);
  if(filters.cohortId&&!batches.some(batch=>batch.id===filters.cohortId))
   throw new PlacementsServiceError("PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH");
  const companies=await db.select({id:placementCompanies.id,name:placementCompanies.name})
    .from(placementCompanyRelationships)
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(eq(placementCompanyRelationships.collegeId,collegeId))
    .orderBy(placementCompanies.name);

  if (filters.seasonId && !season) throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
  const attentionBoundary=new Date(now.getTime()+7*86400000);
  const [attention]=await db.select({
    noApplicants:sql<number>`count(*) filter(where ${placementJobs.status}='PUBLISHED'
      and not exists(select 1 from placement_applications a
        where a.job_id=${placementJobs.id} and a.status='SUBMITTED'))::int`,
    noDeadline:sql<number>`count(*) filter(where ${placementJobs.status}='PUBLISHED'
      and ${placementJobs.applicationDeadline} is null)::int`,
    dueSoon:sql<number>`count(*) filter(where ${placementJobs.status}='PUBLISHED'
      and ${placementJobs.applicationDeadline} >= ${now}
      and ${placementJobs.applicationDeadline} <= ${attentionBoundary})::int`,
    overdue:sql<number>`count(*) filter(where ${placementJobs.status}='PUBLISHED'
      and ${placementJobs.applicationDeadline} < ${now})::int`,
  }).from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
    isNull(placementJobs.archivedAt),season?eq(placementJobs.seasonId,season.id):undefined));
  const attentionCounts=attention??{noApplicants:0,noDeadline:0,dueSoon:0,overdue:0};

  // TPO-drives-04: persistent college-scoped counts power tab badges.
  const [pendingRequestCount]=await db.select({total:count()})
    .from(placementRecruiterDriveRequests)
    .innerJoin(placementCompanyRelationships,and(
      eq(placementCompanyRelationships.id,placementRecruiterDriveRequests.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId,collegeId)))
    .where(and(eq(placementRecruiterDriveRequests.collegeId,collegeId),
      inArray(placementRecruiterDriveRequests.status,["REQUEST","SENT_BACK"])));
  const needsReviewCount=pendingRequestCount?.total??0;
  const [aggregate]=await db.select({
    all:sql<number>`count(*)::int`,
    drafts:sql<number>`count(*) filter(where ${placementJobs.status}='DRAFT')::int`,
    live:sql<number>`count(*) filter(where ${placementJobs.status}='PUBLISHED')::int`,
    closed:sql<number>`count(*) filter(where ${placementJobs.status} in ('CLOSED','CANCELLED'))::int`,
  }).from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
    isNull(placementJobs.archivedAt),season?eq(placementJobs.seasonId,season.id):undefined));
  const statusCounts=aggregate??{all:0,drafts:0,live:0,closed:0};
  const selectedView=defaultTpoDriveView(needsReviewCount,
    typeof raw==="object"&&raw!==null&&"view" in raw?filters.view:undefined);
  if (selectedView === "REQUESTS") {
    const counts = {total:0,drafts:0,live:0,closed:0,deadlinesNextSevenDays:0};
    const common = {seasons,season,companies,batches,cohortId:filters.cohortId,owners,ownerUserId:filters.ownerUserId,
      companyId:filters.companyId,view:selectedView,search:filters.search,
      deadline:filters.deadline,workMode:filters.workMode,
      employmentType:filters.employmentType,sort:filters.sort,display:filters.display,
      minApplied:filters.minApplied,maxApplied:filters.maxApplied,minOffers:filters.minOffers,maxOffers:filters.maxOffers,payCategory:filters.payCategory,attention:filters.attention,journey:filters.journey,
      attentionCounts,needsReviewCount,statusCounts,asOf:now.toISOString()};
    const pattern=tpoApplicantExportSearchPattern(filters.search);
    const requestScope=and(
      eq(placementRecruiterDriveRequests.collegeId,collegeId),
      filters.companyId?eq(placementCompanies.id,filters.companyId):undefined,
      inArray(placementRecruiterDriveRequests.status,["REQUEST","SENT_BACK","DRAFT","REJECTED","CANCELLED"]),
      filters.search?or(
        ilike(placementCompanies.name,pattern),
        sql`${placementRecruiterDriveRequests.draft}->>'title' ilike ${pattern}`,
      ):undefined,
    );
    const [tally]=await db.select({total:count()})
      .from(placementRecruiterDriveRequests)
      .innerJoin(placementCompanyRelationships,and(
        eq(placementCompanyRelationships.id,placementRecruiterDriveRequests.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId,placementRecruiterDriveRequests.collegeId)))
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .where(requestScope);
    const pagination=tpoDriveLifecyclePage(tally?.total??0,filters.page);
    const requestRecords=await db.select({
      id:placementRecruiterDriveRequests.id,
      status:placementRecruiterDriveRequests.status,
      draft:placementRecruiterDriveRequests.draft,
      company:placementCompanies.name,
      createdAt:placementRecruiterDriveRequests.createdAt,
      approvedJobId:placementRecruiterDriveRequests.approvedJobId,
      recruiterUserId:placementRecruiterDriveRequests.recruiterUserId,
      relationshipId:placementRecruiterDriveRequests.companyRelationshipId,
      recruiterEmail:users.email,recruiterPhone:users.phoneE164,
    }).from(placementRecruiterDriveRequests)
      .innerJoin(users,eq(users.id,placementRecruiterDriveRequests.recruiterUserId))
      .innerJoin(placementCompanyRelationships,and(
        eq(placementCompanyRelationships.id,placementRecruiterDriveRequests.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId,placementRecruiterDriveRequests.collegeId)))
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .where(requestScope)
      .orderBy(desc(placementRecruiterDriveRequests.createdAt),desc(placementRecruiterDriveRequests.id))
      .limit(pagination.pageSize).offset(pagination.offset);
    const requestIds=requestRecords.map(row=>row.id);
    const revisions=requestIds.length?await db.select({
      id:activityEvents.subjectId,metadata:activityEvents.metadata,
    }).from(activityEvents).where(and(
      eq(activityEvents.collegeId,collegeId),
      eq(activityEvents.subjectType,"placement_recruiter_drive_request"),
      eq(activityEvents.eventType,"placements.recruiter.drive.updated"),
      inArray(activityEvents.subjectId,requestIds),
    )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(2500):[];
    const revisionByRequest=new Map<string,{previousDraft:unknown;currentDraft:unknown}>();
    for(const item of revisions){
     if(revisionByRequest.has(item.id)||!item.metadata.previousDraft||!item.metadata.currentDraft)continue;
     revisionByRequest.set(item.id,{previousDraft:item.metadata.previousDraft,currentDraft:item.metadata.currentDraft});
    }
    const grants=requestRecords.length?await db.select({
      userId:placementRecruiterCollegeGrants.recruiterUserId,
      relationshipId:placementRecruiterCollegeGrants.companyRelationshipId,
      verificationStatus:placementRecruiterCollegeGrants.verificationStatus,
      validUntil:placementRecruiterCollegeGrants.validUntil,
      status:placementRecruiterCollegeGrants.status,
    }).from(placementRecruiterCollegeGrants).where(and(
      inArray(placementRecruiterCollegeGrants.companyRelationshipId,db.select({id:placementCompanyRelationships.id}).from(placementCompanyRelationships).where(eq(placementCompanyRelationships.collegeId,collegeId))),
      inArray(placementRecruiterCollegeGrants.recruiterUserId,[...new Set(requestRecords.map(row=>row.recruiterUserId))]),
    )):[];
    const grantByRequest=new Map(requestRecords.map(row=>[row.id,
      grants.find(grant=>grant.userId===row.recruiterUserId&&grant.relationshipId===row.relationshipId&&grant.status==="ACTIVE")??null]));
    const requestRows=requestRecords.map(row=>{
      const grant=grantByRequest.get(row.id);
      return {
      id:row.id,status:row.status,
      title:typeof row.draft.title==="string"?row.draft.title:"Untitled drive request",
      company:row.company,createdAt:row.createdAt.toISOString(),
      approvedJobId:row.approvedJobId,
      recruiterEmail:row.recruiterEmail,recruiterPhone:row.recruiterPhone,
      recruiterUserId:row.recruiterUserId,
      verificationStatus:grant?.verificationStatus??"PENDING",
      accessEnded:Boolean(grant?.validUntil&&grant.validUntil<now),
      changes:revisionByRequest.has(row.id)?tpoDriveRequestDifferences(
       revisionByRequest.get(row.id)!.previousDraft,revisionByRequest.get(row.id)!.currentDraft):null,
      };
    });
    return {...pagination,counts:{...counts,total:tally?.total??0},rows:[],requestRows,requestsAvailable:true as const,...common};
  }
  const target=selectedView==="DRAFT"?"DRAFT":selectedView==="LIVE"?"PUBLISHED":selectedView==="CLOSED"?"CLOSED":null;
  const emptyCounts={total:0,drafts:0,live:0,closed:0,deadlinesNextSevenDays:0};
  const projection=await db.transaction(async tx=>{
   const end=new Date(now.getTime()+7*86400000);
   const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
   const number=(kind:string)=>parts.find(part=>part.type===kind)?.value??"01";
   const day=number("year")+"-"+number("month")+"-"+number("day");
   const startOfToday=new Date(day+"T00:00:00+05:30");
   const endOfToday=new Date(startOfToday.getTime()+86400000);
   const deadlineCondition=filters.deadline==="TODAY"?
    and(eq(placementJobs.status,"PUBLISHED"),gte(placementJobs.applicationDeadline,startOfToday),lt(placementJobs.applicationDeadline,endOfToday)):
    filters.deadline==="LATER"?and(eq(placementJobs.status,"PUBLISHED"),gte(placementJobs.applicationDeadline,end)):
    filters.deadline==="DUE_SOON"?and(eq(placementJobs.status,"PUBLISHED"),gte(placementJobs.applicationDeadline,now),lte(placementJobs.applicationDeadline,end)):
    filters.deadline==="OVERDUE"?and(eq(placementJobs.status,"PUBLISHED"),lt(placementJobs.applicationDeadline,now)):
    filters.deadline==="UNSET"?isNull(placementJobs.applicationDeadline):undefined;
   const scope=and(eq(placementJobs.collegeId,collegeId),
    season?eq(placementJobs.seasonId,season.id):undefined,
    filters.companyId?eq(placementCompanies.id,filters.companyId):undefined,
    filters.ownerUserId?eq(placementJobs.createdByUserId,filters.ownerUserId):undefined,
    // Empty cohort targets mean all cohorts, not "target nobody".
    filters.cohortId?sql`(
      not exists(select 1 from placement_job_eligibility_policies policy
        where policy.job_id=${placementJobs.id})
      or exists(select 1 from placement_job_eligibility_policies policy
        where policy.job_id=${placementJobs.id} and
        (cardinality(policy.allowed_cohort_ids)=0 or
         ${filters.cohortId}::uuid=any(policy.allowed_cohort_ids))
       and (cardinality(policy.allowed_program_ids)=0 or
        exists(select 1 from cohorts c where c.id=${filters.cohortId}::uuid
         and c.program_id=any(policy.allowed_program_ids))))
    )`:undefined,
    deadlineCondition,
    filters.workMode!=="ALL"?eq(placementJobs.workMode,filters.workMode):undefined,
    filters.employmentType!=="ALL"?eq(placementJobs.employmentType,filters.employmentType):undefined,
    filters.minApplied!==undefined?sql`(select count(*) from placement_applications ap
      where ap.job_id=${placementJobs.id} and ap.status <> 'WITHDRAWN') >= ${filters.minApplied}`:undefined,
    filters.maxApplied!==undefined?sql`(select count(*) from placement_applications ap
      where ap.job_id=${placementJobs.id} and ap.status <> 'WITHDRAWN') <= ${filters.maxApplied}`:undefined,
    filters.minOffers!==undefined?sql`(select count(*) from placement_offers ofr
      join placement_applications ap on ap.id=ofr.application_id
      where ap.job_id=${placementJobs.id} and ofr.status in ('ISSUED','ACCEPTED'))
      >= ${filters.minOffers}`:undefined,
    filters.maxOffers!==undefined?sql`(select count(*) from placement_offers ofr
      join placement_applications ap on ap.id=ofr.application_id
      where ap.job_id=${placementJobs.id} and ofr.status in ('ISSUED','ACCEPTED'))
      <= ${filters.maxOffers}`:undefined,
    filters.journey==="TAKING_APPLICATIONS"?and(eq(placementJobs.status,"PUBLISHED"),
      or(isNull(placementJobs.applicationDeadline),gte(placementJobs.applicationDeadline,now))):
    filters.journey==="RUNNING_ROUNDS"?and(eq(placementJobs.status,"PUBLISHED"),
      sql`exists(select 1 from placement_job_rounds jr
        where jr.job_id=${placementJobs.id} and jr.status in ('SCHEDULED','COMPLETED'))`):
    filters.journey==="OFFERS_ISSUED"?sql`exists(
      select 1 from placement_offers po join placement_applications pa on pa.id=po.application_id
      where pa.job_id=${placementJobs.id} and po.status in ('ISSUED','ACCEPTED'))`:
    filters.journey==="COMPLETE"?inArray(placementJobs.status,["CLOSED","CANCELLED"]):
    undefined,
    filters.payCategory==="DREAM"?eq(placementJobs.isDream,true):
      filters.payCategory==="REGULAR"?eq(placementJobs.isDream,false):undefined,
    filters.attention==="NO_APPLICANTS"?and(eq(placementJobs.status,"PUBLISHED"),
      sql`not exists(select 1 from placement_applications a where a.job_id=${placementJobs.id} and a.status='SUBMITTED')`):
    filters.attention==="NO_DEADLINE"?and(eq(placementJobs.status,"PUBLISHED"),isNull(placementJobs.applicationDeadline)):
    filters.attention==="DUE_SOON"?and(eq(placementJobs.status,"PUBLISHED"),
      gte(placementJobs.applicationDeadline,now),lte(placementJobs.applicationDeadline,new Date(now.getTime()+7*86400000))):
    filters.attention==="OVERDUE"?and(eq(placementJobs.status,"PUBLISHED"),lt(placementJobs.applicationDeadline,now)):
    undefined,
    isNull(placementJobs.archivedAt),filters.search?or(
     ilike(placementJobs.title,tpoApplicantExportSearchPattern(filters.search)),
     ilike(placementCompanies.name,tpoApplicantExportSearchPattern(filters.search))):undefined);
   const [counts]=await tx.select({total:sql<number>`count(*)::int`,
    drafts:sql<number>`count(*) filter(where ${placementJobs.status} = 'DRAFT')::int`,
    live:sql<number>`count(*) filter(where ${placementJobs.status} = 'PUBLISHED')::int`,
    closed:sql<number>`count(*) filter(where ${placementJobs.status} in ('CLOSED','CANCELLED'))::int`,
    deadlinesNextSevenDays:sql<number>`count(*) filter(where ${placementJobs.status} = 'PUBLISHED'
     and ${placementJobs.applicationDeadline} >= ${now.toISOString()}::timestamptz
     and ${placementJobs.applicationDeadline} <= ${now.toISOString()}::timestamptz + interval '7 days')::int`,
   }).from(placementJobs).innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId)))
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(scope);
   const totals=counts??emptyCounts;
   const totalMatching=selectedView==="DRAFT"?totals.drafts:selectedView==="LIVE"?totals.live:
    selectedView==="CLOSED"?totals.closed:totals.total;
   const pagination=tpoDriveLifecyclePage(totalMatching,filters.page);
   const rows = await tx.select({
    id: placementJobs.id, title: placementJobs.title,
    company: placementCompanies.name, status: placementJobs.status,
    workMode: placementJobs.workMode, employmentType: placementJobs.employmentType,
    minimumAnnualCtcInr: placementJobs.minimumAnnualCtcInr,
    maximumAnnualCtcInr: placementJobs.maximumAnnualCtcInr,
    isDream: placementJobs.isDream,
    createdBy:users.displayName,
    createdByUserId:placementJobs.createdByUserId,
    stipendPerMonthInr:placementJobs.stipendPerMonthInr,
    appliedCount: sql<number>`(select count(*)::int from placement_applications a
      where a.job_id = ${placementJobs.id} and a.status <> 'WITHDRAWN')`,
    offersMade:sql<number>`(select count(*)::int from placement_offers o
      join placement_applications a on a.id=o.application_id
      where a.job_id=${placementJobs.id} and o.status in ('ISSUED','ACCEPTED'))`,
    roundCount:sql<number>`(select count(*)::int from placement_job_rounds r
      where r.job_id=${placementJobs.id} and r.status<>'CANCELLED' and r.kind<>'TALK')`,
    roundsCompleted:sql<number>`(select count(*)::int from placement_job_rounds r
      where r.job_id=${placementJobs.id} and r.status='COMPLETED' and r.kind<>'TALK')`,
    nextRoundAt:sql<Date|null>`(select min(r.scheduled_at) from placement_job_rounds r
      where r.job_id=${placementJobs.id} and r.status='SCHEDULED' and r.scheduled_at is not null)`,
    applicationDeadline: placementJobs.applicationDeadline,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId)))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .innerJoin(users,eq(users.id,placementJobs.createdByUserId))
    .where(and(scope,selectedView==="CLOSED"?
      inArray(placementJobs.status,["CLOSED","CANCELLED"]):
      target?eq(placementJobs.status,target):undefined))
    .orderBy(filters.sort==="DEADLINE_ASC"?sql`${placementJobs.applicationDeadline} asc nulls last`:
      filters.sort==="DEADLINE_DESC"?sql`${placementJobs.applicationDeadline} desc nulls last`:placementCompanies.name,
      placementCompanies.name,placementJobs.title,placementJobs.id)
    .limit(pagination.pageSize).offset(pagination.offset);
   return {counts:totals,...pagination,rows:rows.map((row) => ({
    ...row, applicationDeadline: row.applicationDeadline?.toISOString() ?? null,
    nextRoundAt:row.nextRoundAt?.toISOString()??null,
   }))};
  },{isolationLevel:"repeatable read",accessMode:"read only"});
  return {
    ...projection, seasons, season,companies,batches,cohortId:filters.cohortId,owners,ownerUserId:filters.ownerUserId,
    companyId:filters.companyId, view: selectedView,search:filters.search,deadline:filters.deadline,workMode:filters.workMode,employmentType:filters.employmentType,sort:filters.sort,display:filters.display,
    minApplied:filters.minApplied,maxApplied:filters.maxApplied,minOffers:filters.minOffers,maxOffers:filters.maxOffers,payCategory:filters.payCategory,attention:filters.attention,journey:filters.journey,
    attentionCounts,needsReviewCount,statusCounts,asOf: now.toISOString(),
    requestsAvailable: false as const,
    requestRows: [] as {id:string;status:string;title:string;company:string;createdAt:string;approvedJobId:string|null;
      recruiterEmail:string|null;recruiterPhone:string|null;recruiterUserId:string;
      verificationStatus:string;accessEnded:boolean;changes:TpoDriveRequestDifference[]|null}[],
  };
}
