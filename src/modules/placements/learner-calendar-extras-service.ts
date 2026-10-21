import "server-only";
import {and,asc,eq,gte,inArray,lte,lt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobRounds,placementJobs} from "@/db/schema";
import {placementTpoBlockedDates} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {listLearnerPlacementJobs} from "./learner-job-service";
import {placementTableExists} from "./staged-tables";
import {careerCalendarUtcRangeForIstDays,careerDayKey,
 type CareerCalendarSupplement} from "./learner-career-calendar-model";

export type LearnerCalendarExtraPreview={
 supplements:CareerCalendarSupplement[];
 startDay:string;endDay:string;talksAvailable:boolean;blockedDatesAvailable:boolean;
 talkCount:number;blockedDateCount:number;
};
/** Read-only calendar extras from current learner-visible drives and the
 * authenticated college's own exam blackout dates. Never query foreign jobs.
 * Local IST date bounds become a half-open UTC SQL interval. */
export async function getLearnerCalendarExtras(
 context:RequestContext,startDay:string,endDay:string,
):Promise<LearnerCalendarExtraPreview>{
 const membership=await requireLearnerPlacementAccess(context);
 const {from,toExclusive}=careerCalendarUtcRangeForIstDays(startDay,endDay);
 if(toExclusive.getTime()-from.getTime()>366*86_400_000||
    careerDayKey(from)!==startDay||
    careerDayKey(new Date(toExclusive.getTime()-1))!==endDay)
   throw new Error("Choose a valid calendar range no longer than one year.");
 const [visibleJobs,blockedDatesAvailable]=await Promise.all([
  listLearnerPlacementJobs(context),placementTableExists("placement_tpo_blocked_dates"),
 ]);
 const visibleIds=[...new Set(visibleJobs.map(item=>item.job.id))];
 const db=getDb();
 const talks:{id:string;jobId:string;name:string;title:string;scheduledAt:Date|null}[]=[];
 for(let offset=0;offset<visibleIds.length;offset+=100){
  const matches=await db.select({
   id:placementJobRounds.id,jobId:placementJobs.id,
   name:placementJobRounds.name,title:placementJobs.title,
   scheduledAt:placementJobRounds.scheduledAt,
  }).from(placementJobRounds)
   .innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
   .where(and(inArray(placementJobs.id,visibleIds.slice(offset,offset+100)),
    eq(placementJobs.collegeId,membership.collegeId),
    eq(placementJobs.status,"PUBLISHED"),eq(placementJobRounds.kind,"TALK"),
    gte(placementJobRounds.scheduledAt,from),lt(placementJobRounds.scheduledAt,toExclusive)))
   .orderBy(asc(placementJobRounds.scheduledAt),asc(placementJobRounds.id));
  talks.push(...matches);
 }
 const blackouts=blockedDatesAvailable?await db.select({
  id:placementTpoBlockedDates.id,day:placementTpoBlockedDates.day,
  reason:placementTpoBlockedDates.reason,
 }).from(placementTpoBlockedDates)
  .where(and(eq(placementTpoBlockedDates.collegeId,membership.collegeId),
    gte(placementTpoBlockedDates.day,startDay),
    lte(placementTpoBlockedDates.day,endDay)))
  .orderBy(asc(placementTpoBlockedDates.day)):[];
 const supplements:CareerCalendarSupplement[]=[
  ...talks.flatMap(row=>row.scheduledAt?[{
   key:"talk:"+row.id,kind:"JOB_IMPORTANT_DATE" as const,
   day:careerDayKey(row.scheduledAt),title:"Pre-placement talk · "+row.name,
   companyName:row.title,roleTitle:"Information session",visible:true,
   note:"College-arranged employer talk. Check the drive for participation details.",
  }]:[]),
  ...blackouts.map(row=>({
   key:"exam:"+row.id,kind:"EXAM_BLOCK" as const,day:row.day,
   title:row.reason||"Blocked date — no drives",visible:true,
   note:"College exam or blocked placement date",
  })),
 ];
 return {supplements,startDay,endDay,talksAvailable:true,blockedDatesAvailable,
  talkCount:talks.length,blockedDateCount:blackouts.length};
}
