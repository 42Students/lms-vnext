import "server-only";
import {eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementTpoCollegeSettings} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {tpoOutcomeLabelsAlreadyApplied} from "./tpo-outcome-label-retry-model";
import {AFTER_COLLEGE_LABELS,afterCollegeManualSchema} from "./tpo-after-college-model";

const entrySchema=z.object({
 id:z.string().uuid().nullable().optional(),
 label:z.string().trim().min(2).max(60),
 outcome:afterCollegeManualSchema,
}).strict();
const saveSchema=z.object({
 labels:z.array(entrySchema).max(30),
 expectedVersion:z.iso.datetime({offset:true}).nullable(),
}).strict().superRefine((data,ctx)=>{
 const used=new Set(Object.values(AFTER_COLLEGE_LABELS).map(label=>label.toLocaleLowerCase("en-IN")));
 data.labels.forEach((entry,index)=>{
  const key=entry.label.toLocaleLowerCase("en-IN");
  if(used.has(key))ctx.addIssue({code:"custom",path:["labels",index,"label"],
   message:"That is already one of the fixed choices or is listed twice"});
  used.add(key);
 });
});
export type TpoOutcomeLabel=z.infer<typeof entrySchema>;
export class TpoOutcomeLabelError extends Error{
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"){super(code);}
}
function decodeLabels(raw:unknown):TpoOutcomeLabel[]{
 const parsed=z.array(entrySchema).safeParse(raw);
 return parsed.success?parsed.data.map(row=>({...row,id:row.id??null})):[];
}
/** Fixed after-college vocabulary may be read by any authenticated ACTIVE
 * account, including recruiter/no selected college. Dynamic custom choices
 * still require persisted college/TPO authorization below.
 */
export function fixedTpoOutcomeCatalog(context:RequestContext){
 if(context.user.platformStatus!=="ACTIVE")return {ready:false as const,
  fixed:[] as Array<{value:string;label:string}>,labels:[] as TpoOutcomeLabel[]};
 return {ready:true as const,
  fixed:Object.entries(AFTER_COLLEGE_LABELS).map(([value,label])=>({value,label})),
  labels:[] as TpoOutcomeLabel[]};
}
export async function readTpoOutcomeLabels(context:RequestContext){
 const collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  return {ready:false as const,labels:[] as TpoOutcomeLabel[],version:null};
 // A revoked TPO/College Admin must not receive saved after-college labels
 // using an obsolete request context, even if settings storage exists.
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")
   throw new TpoOutcomeLabelError("TPO_SETTINGS_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [row]=await tx.select({labels:placementTpoCollegeSettings.outcomeLabels,
   updatedAt:placementTpoCollegeSettings.updatedAt})
   .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  return {ready:true as const,labels:decodeLabels(row?.labels),version:row?.updatedAt.toISOString()??null};
 });
}
export async function saveTpoOutcomeLabels(context:RequestContext,raw:unknown){
 const input=saveSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  throw new TpoOutcomeLabelError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoOutcomeLabelError("TPO_SETTINGS_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select({
   updatedAt:placementTpoCollegeSettings.updatedAt,
   outcomeLabels:placementTpoCollegeSettings.outcomeLabels,
  }).from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  const stored=current?z.array(entrySchema).safeParse(current.outcomeLabels):null;
  if(current&&stored?.success&&tpoOutcomeLabelsAlreadyApplied(stored.data,input.labels)){
   return {labels:stored.data.map(row=>({...row,id:row.id??null})),
    version:current.updatedAt.toISOString()};
  }
  if((current?.updatedAt.toISOString()??null)!==input.expectedVersion)
   throw new TpoOutcomeLabelError("TPO_SETTINGS_STALE");
  if(!current)await tx.insert(placementTpoCollegeSettings).values({collegeId});
  const labels=input.labels.map(row=>({...row,id:row.id??crypto.randomUUID()}));
  const [saved]=await tx.update(placementTpoCollegeSettings).set({
   outcomeLabels:labels,updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoCollegeSettings.updatedAt}) + interval '1 millisecond')`,
  }).where(eq(placementTpoCollegeSettings.collegeId,collegeId))
   .returning({updatedAt:placementTpoCollegeSettings.updatedAt});
  if(!saved)throw new TpoOutcomeLabelError("TPO_SETTINGS_NOT_FOUND");
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
   module:"PLACEMENTS",eventType:"placements.tpo_outcome_labels.updated",
   subjectType:"TPO_SETTINGS",subjectId:collegeId,
   summary:"TPO updated after-college labels",
   metadata:{count:labels.length},
  });
  return {labels,version:saved.updatedAt.toISOString()};
 });
}
