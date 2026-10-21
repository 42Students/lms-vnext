import "server-only";
import {asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {effectiveTpoBatchRuleFields,tpoBatchRuleOverridesSchema} from "./tpo-batch-rules-model";
import {getCollegePlacementRules} from "./tpo-policy-service";
import {getTpoJobTypes} from "./tpo-configuration-read-service";
import {TPO_BUILTIN_JOB_TYPES} from "./tpo-builtin-job-types";
import {listTpoBatchCardEligibility} from "./tpo-batch-directory-counts-service";
import {getTpoBatch,listTpoBatchHistory} from "./tpo-batch-workspace-read-service";

/** Legacy BATCH/CLASS/LEARNER map to vNext COHORT/SECTION/MEMBERSHIP.
 * The composite college key is checked by getTpoBatch before any dependent
 * reads. A direct learner choice wins, then an unambiguous class decision,
 * then the batch decision; conflicting classes require review.
 */
export const legacyBatchEligibilityScope={
 BATCH:"COHORT",CLASS:"SECTION",LEARNER:"MEMBERSHIP",
} as const;
export function legacyPlacementBatchState(input:{
 finishedAt:Date|null;eligible:number|null;
}):"NOT_STARTED"|"IN_PLACEMENTS"|"FINISHED"{
 if(input.finishedAt)return "FINISHED";
 return (input.eligible??0)>0?"IN_PLACEMENTS":"NOT_STARTED";
}
export function legacyBatchInviteWindow(input:{
 deadline:Date|null;now:Date;
}):"MISSING_DEADLINE"|"CLOSED"|"OPEN"{
 if(!input.deadline)return "MISSING_DEADLINE";
 // Stored timestamptz is an exclusive UTC instant, displayed separately in IST.
 return input.now.getTime()>=input.deadline.getTime()?"CLOSED":"OPEN";
}
export async function getLegacyCompatibleBatchDetails(ctx:RequestContext,batchId:string){
 const detail=await getTpoBatch(ctx,batchId);
 const [college,types,eligibility,history,classes]=await Promise.all([
  getCollegePlacementRules(ctx,detail.collegeId),
  getTpoJobTypes(ctx),
  listTpoBatchCardEligibility(ctx,[detail.batch.id]),
  listTpoBatchHistory(ctx,detail.batch.id),
  getDb().select({id:sections.id,name:sections.name,status:sections.status})
   .from(sections).where(eq(sections.cohortId,detail.batch.id))
   .orderBy(asc(sections.name)),
 ]);
 const inherited={
  countsAsPlacedAt:college.countsAsPlacedAt as "OFFER_RELEASED"|"OFFER_ACCEPTED",
  maxHeldOffers:college.maxHeldOffers,upliftPct:college.upliftPct,
  minResponseHours:college.minResponseHours,
 };
 const raw=detail.lifecycle?.rulesOverride??null;
 const parsed=tpoBatchRuleOverridesSchema.safeParse(raw);
 const batch=parsed.success?parsed.data:{};
 const effective=effectiveTpoBatchRuleFields(inherited,raw);
 const fixed=new Map<string,{name:string;countsAsPlaced:boolean;drives:number}>();
 for(const type of TPO_BUILTIN_JOB_TYPES)
  fixed.set(type.label.toLowerCase(),{name:type.label,countsAsPlaced:type.countsAsPlaced,drives:0});
 for(const type of types.rows)
  fixed.set(type.label.toLowerCase(),{name:type.label,countsAsPlaced:type.countsAsPlaced,drives:type.drives});
 const jobTypes=[...fixed.values()];
 const summary=eligibility.get(detail.batch.id);
 const state=legacyPlacementBatchState({finishedAt:detail.lifecycle?.finishedAt??null,
  eligible:summary?.eligible??null});
 const recent=history.events.slice(0,50);
 return {...detail,college:inherited,batchRules:batch,effective,jobTypes,classes,
  legacyState:state,history:recent,historyHasMore:history.events.length>50,
  historyAvailable:history.ready,
  lastAction:recent[0]??null,
  invitation:legacyBatchInviteWindow({deadline:detail.lifecycle?.registrationDeadline??null,now:new Date()}),
  rulesValid:parsed.success,jobTypesAvailable:types.ready};
}
