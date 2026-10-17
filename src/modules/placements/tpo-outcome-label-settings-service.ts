import "server-only";
import {eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementTpoCollegeSettings} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {AFTER_COLLEGE_LABELS,afterCollegeManualSchema} from "./tpo-after-college-model";

const entrySchema=z.object({
 id:z.string().uuid().nullable(),
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
 return parsed.success?parsed.data:[];
}
export async function readTpoOutcomeLabels(context:RequestContext){
 const collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  return {ready:false as const,labels:[] as TpoOutcomeLabel[],version:null};
 const [row]=await getDb().select({labels:placementTpoCollegeSettings.outcomeLabels,
  updatedAt:placementTpoCollegeSettings.updatedAt})
  .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
 return {ready:true as const,labels:decodeLabels(row?.labels),version:row?.updatedAt.toISOString()??null};
}
export async function saveTpoOutcomeLabels(context:RequestContext,raw:unknown){
 const input=saveSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_college_settings"))
  throw new TpoOutcomeLabelError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoOutcomeLabelError("TPO_SETTINGS_NOT_FOUND");
  const [current]=await tx.select({updatedAt:placementTpoCollegeSettings.updatedAt})
   .from(placementTpoCollegeSettings).where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  if((current?.updatedAt.toISOString()??null)!==input.expectedVersion)
   throw new TpoOutcomeLabelError("TPO_SETTINGS_STALE");
  if(!current)await tx.insert(placementTpoCollegeSettings).values({collegeId});
  const labels=input.labels.map(row=>({...row,id:row.id??crypto.randomUUID()}));
  const [saved]=await tx.update(placementTpoCollegeSettings).set({
   outcomeLabels:labels,updatedAt:new Date(),
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
