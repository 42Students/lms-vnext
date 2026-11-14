import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges,collegeMemberships,membershipRoles,users,placementTpoCollegeSettings} from "@/db/schema";
import {placementTpoAfterCollege} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {normalizeTpoAfterCollegeDetails,AfterCollegeDetailValidationError} from "./tpo-after-college-details-model";
import {afterCollegeManualSchema} from "./tpo-after-college-model";
import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
const inputSchema=z.object({learnerMembershipId:zUuid,outcome:afterCollegeManualSchema,
 outcomeLabel:z.string().trim().max(60).nullable().optional(),
 outcomeDetail:z.string().trim().max(200).nullable().optional(),
 expectedVersion:z.union([z.literal("none"),z.iso.datetime({offset:true})])}).strict();
export class AfterCollegeError extends Error{
 constructor(public readonly code:"AFTER_COLLEGE_STALE"|"AFTER_COLLEGE_NOT_FOUND"|"AFTER_COLLEGE_PENDING"|"AFTER_COLLEGE_INVALID_LABEL"){
  super(code);this.name="AfterCollegeError";
 }
}
export async function setTpoAfterCollegeOutcome(ctx:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_after_college"))throw new AfterCollegeError("AFTER_COLLEGE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"))).for("update").limit(1);
  if(!college)throw new AfterCollegeError("AFTER_COLLEGE_NOT_FOUND");
  // Rebuild the actor and its roles under SHARE locks inside the write
  // transaction. This authorizes TPO, College Admin and an explicitly
  // scoped Super Admin without impersonating a TPO membership.
  const verifiedActor=await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [target]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(collegeMemberships.id,input.learnerMembershipId),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!target)throw new AfterCollegeError("AFTER_COLLEGE_NOT_FOUND");
  const [old]=await tx.select().from(placementTpoAfterCollege).where(and(
   eq(placementTpoAfterCollege.learnerMembershipId,target.id),eq(placementTpoAfterCollege.collegeId,collegeId))).limit(1);
  if((old?.updatedAt.toISOString()??"none")!==input.expectedVersion)throw new AfterCollegeError("AFTER_COLLEGE_STALE");
  // College row UPDATE lock serializes outcome-label settings mutations with
  // this write, including deletion/rename of a custom label.
  const [settings]=await tx.select({labels:placementTpoCollegeSettings.outcomeLabels})
   .from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  let details;
  try{
    details=normalizeTpoAfterCollegeDetails(input.outcome,{
      outcomeLabel:input.outcomeLabel,outcomeDetail:input.outcomeDetail,
    },old??null,settings?.labels??[]);
  }catch(error){
    if(error instanceof AfterCollegeDetailValidationError)
      throw new AfterCollegeError("AFTER_COLLEGE_INVALID_LABEL");
    throw error;
  }
  if(old?.outcome===input.outcome &&
    old.outcomeLabel===details.outcomeLabel &&
    old.outcomeDetail===details.outcomeDetail)
    return {changed:false,version:old.updatedAt.toISOString()};
  const updatedAt=new Date(Math.max(Date.now(),(old?.updatedAt.getTime()??0)+1));
  await tx.insert(placementTpoAfterCollege).values({learnerMembershipId:target.id,collegeId,
   outcome:input.outcome,...details,updatedAt}).onConflictDoUpdate({target:placementTpoAfterCollege.learnerMembershipId,
    set:{outcome:input.outcome,...details,updatedAt}});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:ctx.user.id,
   actorMembershipId:verifiedActor.membership?.collegeId===collegeId
    ?verifiedActor.membership.id:null,module:"PLACEMENTS",
   eventType:"placements.student.after_college_updated",subjectType:"COLLEGE_MEMBERSHIP",
   subjectId:target.id,summary:"TPO updated a learner after-college destination",
   // Details may identify personal aspirations; never publish them through
   // general activity/event feeds.
   metadata:{outcome:input.outcome,hasPrivateDetail:Boolean(details.outcomeDetail)},
  });
  return {changed:true,version:updatedAt.toISOString()};
 });
}
