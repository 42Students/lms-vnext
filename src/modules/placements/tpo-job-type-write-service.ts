import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoJobTypes} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {tpoJobTypeNameSchema} from "./tpo-configuration-model";
const createSchema=z.object({label:tpoJobTypeNameSchema}).strict();
export class TpoConfigError extends Error{
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_JOB_TYPE_EXISTS"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"){
  super(code);this.name="TpoConfigError";
 }
}
export async function createTpoJobType(context:RequestContext,raw:unknown){
 const input=createSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  const [existing]=await tx.select({id:placementTpoJobTypes.id}).from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.collegeId,collegeId),
    sql`lower(${placementTpoJobTypes.label}) = lower(${input.label}::text)`)).limit(1);
  if(existing)throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
  const [created]=await tx.insert(placementTpoJobTypes).values({
   collegeId,label:input.label,active:true,
  }).returning({id:placementTpoJobTypes.id,label:placementTpoJobTypes.label});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_type.created",
   subjectType:"JOB_TYPE",subjectId:created.id,summary:"TPO added a college job type",
   metadata:{label:created.label},
  });
  return created;
 });
}
