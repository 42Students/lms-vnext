import "server-only";
import {eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementTpoCollegeSettings} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";

const changeSchema=z.discriminatedUnion("section",[
 z.object({section:z.literal("SMS_CAP"),smsMonthlyCap:z.number().int().min(0).max(100000),expectedVersion:z.iso.datetime({offset:true}).nullable()}).strict(),
 z.object({section:z.literal("SIGNATURE"),emailSignature:z.string().trim().max(300),expectedVersion:z.iso.datetime({offset:true}).nullable()}).strict(),
 z.object({section:z.literal("RECRUITER_DURATION"),recruiterAccessMonths:z.union([z.literal(3),z.literal(6),z.literal(12),z.literal(24)]),expectedVersion:z.iso.datetime({offset:true}).nullable()}).strict(),
]);
export class TpoCommunicationSettingsError extends Error {
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"){super(code);}
}

export async function getTpoCommunicationSettings(context:RequestContext){
 const collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  return {ready:false as const,smsMonthlyCap:500,emailSignature:"",recruiterAccessMonths:6,version:null};
 const [row]=await getDb().select({smsMonthlyCap:placementTpoCollegeSettings.smsMonthlyCap,
  emailSignature:placementTpoCollegeSettings.emailSignature,recruiterAccessMonths:placementTpoCollegeSettings.recruiterAccessMonths,updatedAt:placementTpoCollegeSettings.updatedAt})
  .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
 return {ready:true as const,smsMonthlyCap:row?.smsMonthlyCap??500,
  emailSignature:row?.emailSignature??"",recruiterAccessMonths:row?.recruiterAccessMonths??6,version:row?.updatedAt.toISOString()??null};
}

export async function updateTpoCommunicationSettings(context:RequestContext,raw:unknown){
 const input=changeSchema.parse(raw);
 const collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  throw new TpoCommunicationSettingsError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoCommunicationSettingsError("TPO_SETTINGS_NOT_FOUND");
  const [current]=await tx.select().from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  if((current?.updatedAt.toISOString()??null)!==input.expectedVersion)
   throw new TpoCommunicationSettingsError("TPO_SETTINGS_STALE");
  if(!current)await tx.insert(placementTpoCollegeSettings).values({collegeId});
  const changes=input.section==="SMS_CAP"?{smsMonthlyCap:input.smsMonthlyCap}:
   input.section==="SIGNATURE"?{emailSignature:input.emailSignature}:
   {recruiterAccessMonths:input.recruiterAccessMonths};
  const [updated]=await tx.update(placementTpoCollegeSettings).set({...changes,updatedAt:new Date()})
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId))
   .returning({updatedAt:placementTpoCollegeSettings.updatedAt});
  if(!updated)throw new TpoCommunicationSettingsError("TPO_SETTINGS_NOT_FOUND");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_communication_setting.updated",subjectType:"TPO_SETTINGS",
   subjectId:collegeId,summary:input.section==="SMS_CAP"?"TPO changed the optional SMS monthly cap":
    input.section==="SIGNATURE"?"TPO changed the email signature":"TPO changed recruiter access duration",
   metadata:input.section==="SMS_CAP"?{field:"smsMonthlyCap",value:input.smsMonthlyCap}:
    input.section==="SIGNATURE"?{field:"emailSignature",length:input.emailSignature.length}:
    {field:"recruiterAccessMonths",value:input.recruiterAccessMonths},
  });
  return {saved:true,version:updated.updatedAt.toISOString()};
 });
}
