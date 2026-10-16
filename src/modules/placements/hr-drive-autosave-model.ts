import {z} from "zod";
import type {HrDriveDraft} from "./hr-drive-draft-model";

/** REC-home-drives-29: autosave a typed but not necessarily complete draft.
 * Only formal request submission uses the strict final draft validator. */
const shape=z.strictObject({
 title:z.string().max(200),description:z.string().max(5000),location:z.string().max(180),
 employmentType:z.enum(["FULL_TIME","INTERNSHIP","CONTRACT"]),
 workMode:z.enum(["ONSITE","HYBRID","REMOTE","NO_PREFERENCE"]),
 minimumAnnualCtcInr:z.string().max(32),maximumAnnualCtcInr:z.string().max(32),
 minimumCgpa:z.string().max(32),fixedAnnualCtcInr:z.string().max(32),
 variableAnnualCtcInr:z.string().max(32),bondMonths:z.string().max(32),
 bondAmountInr:z.string().max(32),maximumActiveBacklogs:z.string().max(32),
 rounds:z.array(z.strictObject({
  kind:z.enum(["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"]),
  name:z.string().max(120),
 })).max(12),
});
const envelope=z.strictObject({version:z.literal(2),draft:shape});
export function saveHrAutoDraft(draft:HrDriveDraft):string|null{
 const result=shape.safeParse(draft);
 if(!result.success)return null;
 const raw=JSON.stringify({version:2,draft:result.data});
 return raw.length<=20000?raw:null;
}
export function restoreHrAutoDraft(raw:string|null):HrDriveDraft|null{
 if(!raw||raw.length>20000)return null;
 try{
  const parsed=envelope.safeParse(JSON.parse(raw) as unknown);
  return parsed.success?parsed.data.draft:null;
 }catch{return null;}
}
