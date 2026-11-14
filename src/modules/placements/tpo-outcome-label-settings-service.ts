import "server-only";
import {and,eq,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementTpoCollegeSettings} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {tpoOutcomeLabelsAlreadyApplied} from "./tpo-outcome-label-retry-model";
import {AFTER_COLLEGE_LABELS,afterCollegeCustomLabelOutcomeSchema} from "./tpo-after-college-model";
import {placementTpoAfterCollege} from "@/db/schema/tpo-configuration";

import { zUuid } from "@/lib/schema-primitives";
const entrySchema=z.object({
 id:zUuid.nullable().optional(),
 label:z.string().transform(value=>value.trim().replace(/\s+/g," "))
  .pipe(z.string().min(2).max(60)),
 outcome:afterCollegeCustomLabelOutcomeSchema,
}).strict();
const saveSchema=z.object({
 labels:z.array(entrySchema).max(30),
 expectedVersion:z.iso.datetime({offset:true}).nullable(),
}).strict().superRefine((data,ctx)=>{
 const used=new Set(Object.values(AFTER_COLLEGE_LABELS).map(label=>label.toLocaleLowerCase("en-IN")));
 const ids=new Set<string>();
 data.labels.forEach((entry,index)=>{
  const key=entry.label.toLocaleLowerCase("en-IN");
  if(used.has(key))ctx.addIssue({code:"custom",path:["labels",index,"label"],
   message:"That is already one of the fixed choices or is listed twice"});
  used.add(key);
  if(entry.id){
   if(ids.has(entry.id))ctx.addIssue({code:"custom",path:["labels",index,"id"],
    message:"The same saved label cannot be listed twice"});
   ids.add(entry.id);
  }
 });
});
export type TpoOutcomeLabel=z.infer<typeof entrySchema>;
export class TpoOutcomeLabelError extends Error{
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"|"TPO_SETTINGS_INVALID_LABEL"){super(code);}
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
  return {ready:false as const,labels:[] as TpoOutcomeLabel[],version:null,collegeId};
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
  return {ready:true as const,labels:decodeLabels(row?.labels),version:row?.updatedAt.toISOString()??null,collegeId};
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
  const verifiedActor=await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select({
   updatedAt:placementTpoCollegeSettings.updatedAt,
   outcomeLabels:placementTpoCollegeSettings.outcomeLabels,
  }).from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,collegeId)).limit(1);
  const stored=current?z.array(entrySchema).safeParse(current.outcomeLabels):null;
  // A corrupt persisted catalog cannot be silently overwritten. Preserve it
  // for explicit recovery rather than destroying the identity crosswalk.
  // NULL is a legitimate pristine catalog (no labels configured).
  // Only malformed non-NULL JSON is a fail-closed data integrity issue.
  if(current&&current.outcomeLabels!==null&&!stored?.success)
   throw new TpoOutcomeLabelError("TPO_SETTINGS_INVALID_LABEL");
  if(current&&stored?.success&&tpoOutcomeLabelsAlreadyApplied(
    stored.data.map(row=>({...row,id:row.id??null})),
    input.labels.map(row=>({...row,id:row.id??null})))){
   return {labels:stored.data.map(row=>({...row,id:row.id??null})),
    version:current.updatedAt.toISOString()};
  }
  if((current?.updatedAt.toISOString()??null)!==input.expectedVersion)
   throw new TpoOutcomeLabelError("TPO_SETTINGS_STALE");
  // Existing labels keep the immutable identity that ties them to students.
  // Legacy rejected unknown stable label IDs instead of inventing them.
  const knownIds=new Set(stored?.success?stored.data.map(row=>row.id).filter(
   (id):id is string=>typeof id==="string"&&id.length>0):[]);
  if(input.labels.some(row=>row.id&&!knownIds.has(row.id)))
   throw new TpoOutcomeLabelError("TPO_SETTINGS_INVALID_LABEL");
  if(!current)await tx.insert(placementTpoCollegeSettings).values({collegeId});
  const labels=input.labels.map(row=>({...row,id:row.id??crypto.randomUUID()}));
  const [saved]=await tx.update(placementTpoCollegeSettings).set({
   outcomeLabels:labels,updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoCollegeSettings.updatedAt}) + interval '1 millisecond')`,
  }).where(eq(placementTpoCollegeSettings.collegeId,collegeId))
   .returning({updatedAt:placementTpoCollegeSettings.updatedAt});
  if(!saved)throw new TpoOutcomeLabelError("TPO_SETTINGS_NOT_FOUND");
  // Legacy OutcomeLabels save propagates both renamed labels and their
  // outcome reclassifications to existing student destinations. Evaluate every
  // old label against the ORIGINAL persisted row in ONE SQL UPDATE: a swap of
  // A <-> B cannot be accidentally applied twice by sequential updates.
  // The college UPDATE lock serializes this cascade with after-college writes.
  // Preserve private outcome details, and NEVER mutate registration consent.
  const nextById=new Map(labels.filter(row=>row.id).map(row=>[row.id,row]));
  const changes=(stored?.success?stored.data:[]).flatMap(old=>{
    const replacement=old.id?nextById.get(old.id):undefined;
    const nextLabel=replacement?.label??null;
    const nextOutcome=replacement?.outcome??old.outcome;
    if(nextLabel===old.label&&nextOutcome===old.outcome)return [];
    return [{oldLabel:old.label,oldOutcome:old.outcome,nextLabel,nextOutcome}];
  });
  if(changes.length){
    const oldRowMatches=changes.map(row=>and(
      eq(placementTpoAfterCollege.outcome,row.oldOutcome),
      eq(placementTpoAfterCollege.outcomeLabel,row.oldLabel),
    ));
    const whenOutcome=changes.map(row=>sql`when ${placementTpoAfterCollege.outcome} = ${row.oldOutcome}
      and ${placementTpoAfterCollege.outcomeLabel} = ${row.oldLabel} then ${row.nextOutcome}`);
    const whenLabel=changes.map(row=>sql`when ${placementTpoAfterCollege.outcome} = ${row.oldOutcome}
      and ${placementTpoAfterCollege.outcomeLabel} = ${row.oldLabel} then ${row.nextLabel}`);
    await tx.update(placementTpoAfterCollege).set({
      outcome:sql`case ${sql.join(whenOutcome,sql` `)} else ${placementTpoAfterCollege.outcome} end`,
      outcomeLabel:sql`case ${sql.join(whenLabel,sql` `)} else ${placementTpoAfterCollege.outcomeLabel} end`,
      updatedAt:sql`greatest(clock_timestamp(), ${placementTpoAfterCollege.updatedAt} + interval '1 millisecond')`,
    }).where(and(eq(placementTpoAfterCollege.collegeId,collegeId),
      or(...oldRowMatches)));
  }
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:context.user.id,
   actorMembershipId:verifiedActor.membership?.collegeId===collegeId
    ?verifiedActor.membership.id:null,
   module:"PLACEMENTS",eventType:"placements.tpo_outcome_labels.updated",
   subjectType:"TPO_SETTINGS",subjectId:collegeId,
   summary:"TPO updated after-college labels",
   metadata:{count:labels.length},
  });
  return {labels,version:saved.updatedAt.toISOString()};
 });
}


/** Batched page read: fixed vocabulary and any editable college overrides are
 * returned as one response snapshot. Universal mode intentionally never
 * touches the college table or exposes another tenant's custom choices.
 * SCOPED mode propagates missing-college, revoked-role and storage failures,
 * never converting authorization failures into an empty but "valid" list. */
export async function readTpoOutcomeChoiceCatalog(
 context:RequestContext,mode:"UNIVERSAL"|"SCOPED",
){
 const base=fixedTpoOutcomeCatalog(context);
 const fixed=base.fixed.map((item,index)=>({
   id:item.value,value:item.value,label:item.label,source:"FIXED" as const,
   order:index,outcome:item.value,
 }));
 if(mode==="UNIVERSAL"){
  return {...base,scope:"UNIVERSAL" as const,version:null,
    choices:fixed,collegeId:null};
 }
 const college=await readTpoOutcomeLabels(context);
 const custom=college.labels.map((row,index)=>({
   id:row.id??"",value:row.id??"",label:row.label,
   source:"COLLEGE" as const,order:fixed.length+index,
   outcome:row.outcome,
 }));
 return {fixed:base.fixed,labels:college.labels,
  ready:base.ready&&college.ready,version:college.version,
  scope:"SCOPED" as const,collegeId:college.collegeId,
  choices:[...fixed,...custom]};
}

/** Immutable source-to-canonical ID crosswalk used only for an explicitly
 * approved import. Historical numeric IDs never serve as API identifiers.
 * Distinct labels are retained under their per-college scope and conflict
 * with fixed choices is rejected rather than silently relabeled. */
export function mappedLegacyOutcomeLabel(
 row:{legacyId:number;label:string;outcome:z.infer<typeof afterCollegeCustomLabelOutcomeSchema>},
 canonicalId:string,
){
 if(!Number.isSafeInteger(row.legacyId)||row.legacyId<1)
  throw new Error("Invalid source outcome-label ID");
 const parsed=entrySchema.parse({id:canonicalId,label:row.label,outcome:row.outcome});
 if(Object.values(AFTER_COLLEGE_LABELS).some(label=>
    label.toLocaleLowerCase("en-IN")===parsed.label.toLocaleLowerCase("en-IN")))
  throw new Error("Source outcome label conflicts with a fixed choice");
 return {legacyId:row.legacyId,...parsed,id:canonicalId};
}
