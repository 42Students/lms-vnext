import "server-only";
import {and,desc,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,placementCompanies,placementCompanyRelationships,users} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {platformSettingOverrides} from "@/db/schema/platform-setting-overrides";
import {storedPlacementPolicyValue} from "./platform-placement-policy-model";

export type CollegeAttentionCategory="STALE_APPLIED"|"INTERVIEW_UNSCHEDULED"|"MISSING_OFFER_LETTER"|"LOW_CONVERSION";
type AttentionExample={id:string;name:string;detail:string;href:string};
type AttentionItem={jobId:string;title:string;category:CollegeAttentionCategory;
 count:number;href:string;examples:AttentionExample[]};
export async function getCollegeDriveAttention(context:RequestContext,rawJobId?:string){
 const collegeId=await requireCollegePlacementAdmin(context),db=getDb();
 if(rawJobId&&!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(rawJobId))
  throw Error("Invalid drive identifier.");
 const settingKeys=["placement.staleAppliedDays","placement.closingSoonDays",
  "placement.needsAttentionSampleCap","placement.lowConversionThreshold"];
 const overrides=await db.select({key:platformSettingOverrides.key,value:platformSettingOverrides.value})
  .from(platformSettingOverrides)
  .where(and(eq(platformSettingOverrides.scopeType,"GLOBAL"),
   eq(platformSettingOverrides.scopeId,"GLOBAL"),inArray(platformSettingOverrides.key,settingKeys)));
 const values=new Map(overrides.map(row=>[row.key,row.value]));
 const staleDays=storedPlacementPolicyValue("placement.staleAppliedDays",values.get("placement.staleAppliedDays"));
 const closingDays=storedPlacementPolicyValue("placement.closingSoonDays",values.get("placement.closingSoonDays"));
 const sampleCap=storedPlacementPolicyValue("placement.needsAttentionSampleCap",values.get("placement.needsAttentionSampleCap"));
 const conversionThreshold=storedPlacementPolicyValue("placement.lowConversionThreshold",values.get("placement.lowConversionThreshold"));
 const staleBefore=new Date(Date.now()-staleDays*86400000);
 // Distinct paginated active jobs and cross-status KPI counts. Never use the
 // first 60 job rows as the total number of drives in this college.
 const [driveCounts]=await db.select({
  all:sql<number>`count(*)::integer`,
  published:sql<number>`count(*) filter (where ${placementJobs.status}='PUBLISHED' and ${placementJobs.archivedAt} is null)::integer`,
 }).from(placementJobs).where(eq(placementJobs.collegeId,collegeId));
 const allDriveCount=driveCounts?.all??0;
 const activeDriveCount=driveCounts?.published??0;
 const jobs=await db.select({id:placementJobs.id,title:placementJobs.title,
  companyName:placementCompanies.name,
  deadline:placementJobs.applicationDeadline,status:placementJobs.status})
  .from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementJobs.collegeId,collegeId),
    eq(placementJobs.status,"PUBLISHED"),isNull(placementJobs.archivedAt)))
  .orderBy(desc(placementJobs.createdAt)).limit(60);
 // Include a directly opened older or archived job without widening its
 // visibility to public discovery or silently limiting attention to 60 drives.
 if(rawJobId&&!jobs.some(job=>job.id===rawJobId)){
  const [target]=await db.select({id:placementJobs.id,title:placementJobs.title,
   companyName:placementCompanies.name,deadline:placementJobs.applicationDeadline,
   status:placementJobs.status})
   .from(placementJobs)
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.id,rawJobId))).limit(1);
  if(target)jobs.push(target);
 }
 if(!jobs.length)return {jobs:[],total:0,categories:[] as AttentionItem[],hasOfferLetterEvidence:true,lookbackDays:staleDays,
  allDriveCount,activeDriveCount,inactiveDriveCount:allDriveCount-activeDriveCount};
 const records=await db.select({
  jobId:placementApplications.jobId,
  total:sql<number>`count(*)::integer`.as("app_count"),
  stale:sql<number>`count(*) filter (where
    coalesce(${placementCollegeApplicationStages.stage},
      case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
       when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
       else 'APPLIED' end)='APPLIED'
    and ${placementApplications.submittedAt} < ${staleBefore})::integer`.as("stale"),
  withoutSlot:sql<number>`count(*) filter (where
    ${placementCollegeApplicationStages.stage}='INTERVIEW'
    and not exists(select 1 from placement_round_candidate_slots s
      where s.job_id=${placementApplications.jobId}
        and s.application_id=${placementApplications.id} and s.status='BOOKED'))::integer`.as("unscheduled"),
  missingOfferLetter:sql<number>`count(*) filter (where exists (
    select 1 from placement_offers o
    where o.application_id=${placementApplications.id}
     and o.status in ('ISSUED','ACCEPTED')
     and (o.offer_letter_url is null or trim(o.offer_letter_url)='')
  ))::integer`.as("missing_offer_letter"),
  shortlisted:sql<number>`count(*) filter (where
    coalesce(${placementCollegeApplicationStages.stage},
      ${placementApplicationScreenings.status}) in
      ('SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED'))::integer`.as("progressed"),
 }).from(placementApplications)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
  .leftJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .leftJoin(placementCollegeApplicationStages,
    eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
  .where(and(inArray(placementApplications.jobId,jobs.map(job=>job.id)),
    eq(placementApplications.status,"SUBMITTED")))
  .groupBy(placementApplications.jobId);
 const counts=new Map(records.map(row=>[row.jobId,row]));
 const categories: AttentionItem[]=[];
 const now=Date.now();
 for(const job of jobs){
  const row=counts.get(job.id);
  if(!row)continue;
  const base="/college/placements/jobs/"+job.id+"/applications";
  if(row.stale>0)categories.push({jobId:job.id,title:job.title,
   category:"STALE_APPLIED",count:row.stale,href:base+"?stage=APPLIED",examples:[]});
  if(row.withoutSlot>0)categories.push({jobId:job.id,title:job.title,
   category:"INTERVIEW_UNSCHEDULED",count:row.withoutSlot,href:base+"?stage=INTERVIEW",examples:[]});
  if(row.missingOfferLetter>0)categories.push({jobId:job.id,title:job.title,
   category:"MISSING_OFFER_LETTER",count:row.missingOfferLetter,href:base+"?stage=OFFERED",examples:[]});
  if(job.deadline&&job.deadline.getTime()>now&&job.deadline.getTime()-now<closingDays*86400000&&
    row.total>=5&&row.shortlisted/row.total<conversionThreshold){
    categories.push({jobId:job.id,title:job.title,category:"LOW_CONVERSION",
     count:row.total-row.shortlisted,href:base+"?stage=APPLIED",examples:[]});
  }
 }
 // The aggregate is the authoritative count; this bounded read supplies
 // named learner examples, not a second estimate of the category totals.
 // No learner outside this authorized college or selected drives is returned.
 if(categories.length){
  const lowConversionJobs=categories.filter(item=>item.category==="LOW_CONVERSION")
   .map(item=>item.jobId);
  const actionable=await db.select({
   id:placementApplications.id,jobId:placementApplications.jobId,
   displayName:users.displayName,
   stale:sql<boolean>`coalesce(${placementCollegeApplicationStages.stage},
     case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
      when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
      else 'APPLIED' end)='APPLIED'
     and ${placementApplications.submittedAt}<${staleBefore}`,
   unscheduled:sql<boolean>`${placementCollegeApplicationStages.stage}='INTERVIEW'
     and not exists(select 1 from placement_round_candidate_slots s
       where s.job_id=${placementApplications.jobId}
        and s.application_id=${placementApplications.id} and s.status='BOOKED')`,
   lowConversion:sql<boolean>`coalesce(${placementCollegeApplicationStages.stage},
     ${placementApplicationScreenings.status},'APPLIED') not in
     ('SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED')`,
   missingLetter:sql<boolean>`exists(select 1 from placement_offers o
      where o.application_id=${placementApplications.id}
       and o.status in ('ISSUED','ACCEPTED')
       and (o.offer_letter_url is null or trim(o.offer_letter_url)=''))`,
  }).from(placementApplications)
   .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .leftJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .leftJoin(placementCollegeApplicationStages,
    eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
   .where(and(
    inArray(placementApplications.jobId,jobs.map(job=>job.id)),
    eq(placementApplications.status,"SUBMITTED"),
    or(
     sql`(
      (coalesce(${placementCollegeApplicationStages.stage},
        case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
         when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
         else 'APPLIED' end)='APPLIED'
       and ${placementApplications.submittedAt}<${staleBefore})
      or (${placementCollegeApplicationStages.stage}='INTERVIEW' and not exists(
       select 1 from placement_round_candidate_slots s
       where s.job_id=${placementApplications.jobId}
        and s.application_id=${placementApplications.id} and s.status='BOOKED'))
      or exists(select 1 from placement_offers o
       where o.application_id=${placementApplications.id}
        and o.status in ('ISSUED','ACCEPTED')
        and (o.offer_letter_url is null or trim(o.offer_letter_url)=''))
     )`,
     lowConversionJobs.length?and(
      inArray(placementApplications.jobId,lowConversionJobs),
      sql`coalesce(${placementCollegeApplicationStages.stage},
        ${placementApplicationScreenings.status},'APPLIED') not in
        ('SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED')`,
     ):undefined,
    ),
   ))
   .orderBy(desc(placementApplications.submittedAt),placementApplications.id)
   .limit(900);
  const byCategory=new Map<string, AttentionItem>(categories.map(item=>[item.jobId+":"+item.category,item] as const));
  for(const applicant of actionable){
   const matches:CollegeAttentionCategory[]=[];
   if(applicant.stale)matches.push("STALE_APPLIED");
   if(applicant.unscheduled)matches.push("INTERVIEW_UNSCHEDULED");
   if(applicant.missingLetter)matches.push("MISSING_OFFER_LETTER");
   if(applicant.lowConversion)matches.push("LOW_CONVERSION");
   for(const category of matches){
    const item=byCategory.get(applicant.jobId+":"+category);
    if(!item||item.examples.length>=sampleCap)continue;
    item.examples.push({
     id:applicant.id,name:applicant.displayName?.trim()||"Unnamed learner",
     detail:category==="STALE_APPLIED"?"Application awaiting review":
      category==="INTERVIEW_UNSCHEDULED"?"Interview not scheduled":
      category==="MISSING_OFFER_LETTER"?"Offer letter missing":"Awaiting shortlist review",
     href:"/college/placements/jobs/"+encodeURIComponent(applicant.jobId)+
      "/applications?applicationId="+encodeURIComponent(applicant.id),
    });
   }
  }
 }
 return {jobs:jobs.map(job=>({...job,applicants:counts.get(job.id)?.total??0,
  attention:categories.filter(row=>row.jobId===job.id).reduce((n,row)=>n+row.count,0)})),
  // The legacy Needs attention total is the sum of affected candidate items,
  // not the number of category labels rendered in a grid.
  total:categories.reduce((count,item)=>count+item.count,0),
  categories,hasOfferLetterEvidence:true,
  allDriveCount,activeDriveCount,inactiveDriveCount:allDriveCount-activeDriveCount,
  lookbackDays:staleDays,closingSoonDays:closingDays,sampleCap,conversionThreshold};
}
