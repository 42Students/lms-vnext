import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoAfterCollege} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {afterCollegeManualSchema} from "./tpo-after-college-model";
import {z} from "zod";
const inputSchema=z.object({learnerMembershipId:z.string().uuid(),outcome:afterCollegeManualSchema,
 expectedVersion:z.union([z.literal("none"),z.iso.datetime({offset:true})])}).strict();
export class AfterCollegeError extends Error{
 constructor(public readonly code:"AFTER_COLLEGE_STALE"|"AFTER_COLLEGE_NOT_FOUND"|"AFTER_COLLEGE_PENDING"){
  super(code);this.name="AfterCollegeError";
 }
}
export async function setTpoAfterCollegeOutcome(ctx:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_after_college"))throw new AfterCollegeError("AFTER_COLLEGE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new AfterCollegeError("AFTER_COLLEGE_NOT_FOUND");
  const [actor]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
   .where(and(eq(collegeMemberships.id,ctx.membership!.id),
    eq(collegeMemberships.userId,ctx.user.id),eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!actor)throw new AfterCollegeError("AFTER_COLLEGE_NOT_FOUND");
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
  if(old?.outcome===input.outcome)return {changed:false,version:old.updatedAt.toISOString()};
  const updatedAt=new Date();
  await tx.insert(placementTpoAfterCollege).values({learnerMembershipId:target.id,collegeId,
   outcome:input.outcome,updatedAt}).onConflictDoUpdate({target:placementTpoAfterCollege.learnerMembershipId,
    set:{outcome:input.outcome,updatedAt}});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.student.after_college_updated",subjectType:"COLLEGE_MEMBERSHIP",
   subjectId:target.id,summary:"TPO updated a learner after-college destination",
   metadata:{outcome:input.outcome},
  });
  return {changed:true,version:updatedAt.toISOString()};
 });
}
