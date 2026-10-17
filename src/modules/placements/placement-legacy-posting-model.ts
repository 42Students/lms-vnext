import {z} from "zod";
/** Supplemental legacy job-form details do not grant cross-college visibility
 * or override the enforceable placement eligibility policy.
 */
export const placementLegacyPostingDetailsSchema=z.strictObject({
 responsibilities:z.string().trim().max(15000).default(""),
 assessmentUrl:z.union([z.url().refine(v=>/^https?:\/\//i.test(v),"Use HTTP or HTTPS"),z.literal("")])
  .nullable().optional().default(null).transform(v=>v||null),
 assessmentDeadline:z.iso.datetime({offset:true}).nullable().optional().default(null),
 importantDates:z.array(z.strictObject({
  label:z.string().trim().min(1).max(120),at:z.iso.datetime({offset:true}),
 })).max(20).default([]),
 candidatePreferences:z.strictObject({
  preferredDegree:z.string().trim().max(160).default(""),
  specialization:z.string().trim().max(160).default(""),
  graduationYear:z.number().int().min(1990).max(2050).nullable().default(null),
  minGpa:z.number().min(0).max(10).nullable().default(null),
  city:z.string().trim().max(160).default(""),
 }).default({}),
 customEligibilityRules:z.array(z.strictObject({
  label:z.string().trim().min(1).max(160),
  value:z.string().trim().min(1).max(500),
 })).max(20).default([]),
}).superRefine((data,ctx)=>{
 const reserved=new Set(["application deadline"]);
 const keys=new Set<string>();
 for(const [i,date] of data.importantDates.entries()){
  const label=date.label.toLowerCase();
  if(reserved.has(label)||keys.has(label))
   ctx.addIssue({code:"custom",path:["importantDates",i,"label"],message:"Important date labels must be unique and cannot be Application deadline."});
  keys.add(label);
 }
});
export function parseLegacyPairs(raw:string,kind:"date"|"rule"){
 const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(lines.length>20)throw new Error("A maximum of 20 entries is allowed.");
 return lines.map(line=>{
  const at=line.indexOf("|");
  if(at<1||at===line.length-1)
   throw new Error(kind==="date"?"Use Label | YYYY-MM-DDTHH:MM for each important date.":"Use Label | Value for each custom rule.");
  const label=line.slice(0,at).trim(),value=line.slice(at+1).trim();
  if(!label||!value)throw new Error("Label and value are required.");
  return {label,value};
 });
}

/** Preserve persisted assessment chronology during partial job edits. */
export function isLegacyAssessmentDeadlineAfterApplication(
 assessmentDeadline:string|null|undefined, applicationDeadline:Date|null|undefined,
):boolean {
 if(!assessmentDeadline)return true;
 if(!applicationDeadline)return false;
 const value=Date.parse(assessmentDeadline);
 return Number.isFinite(value)&&value>applicationDeadline.getTime();
}
