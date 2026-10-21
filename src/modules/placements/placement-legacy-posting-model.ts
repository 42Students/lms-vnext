import {z} from "zod";
/** Supplemental legacy job-form details do not grant cross-college visibility
 * or override the enforceable placement eligibility policy.
 */
export const placementLegacyPostingDetailsSchema=z.strictObject({
 responsibilities:z.string().trim().max(15000).default(""),
 // TPO-drives-29/30/38: bounded supplemental details; these are not eligibility rules.
 campusPool:z.strictObject({
  hostCollege:z.string().trim().max(160).default(""),
  reportingTime:z.iso.datetime({offset:true}).nullable().default(null),
  travelNote:z.string().trim().max(1000).default(""),
 }).prefault({}),
 portal:z.strictObject({
  studentsRegisterSeparately:z.boolean().default(false),
  name:z.string().trim().max(160).default(""),
  url:z.union([z.url().refine(v=>{try{const url=new URL(v);return url.protocol==="https:"&&!url.username&&!url.password;}catch{return false;}},"Use an HTTPS URL without embedded credentials"),z.literal("")]).default(""),
 }).prefault({}),
 skillsWanted:z.array(z.string().trim().min(1).max(50)).max(30).default([]),

 assessmentUrl:z.union([z.url().refine(v=>/^https?:\/\//i.test(v),"Use HTTP or HTTPS"),z.literal("")])
  .nullable().optional().default(null).transform(v=>v||null),
 assessmentDeadline:z.iso.datetime({offset:true}).nullable().optional().default(null),
 importantDates:z.array(z.strictObject({
  label:z.string().trim().min(1).max(120),
  at:z.iso.datetime({offset:true}).optional(),
  date:z.union([z.iso.date(),z.iso.datetime({offset:true})]).optional(),
  type:z.string().trim().max(80).optional(),
  dateType:z.string().trim().max(80).optional(),
 }).refine(v=>Boolean(v.at||v.date),{message:"Important date is required",path:["at"]})
  .transform(v=>({
   label:v.label,
   at:v.at??(v.date!.length===10?v.date+"T00:00:00.000Z":v.date!),
   ...(v.type?{type:v.type}:{}),
   ...(v.dateType?{dateType:v.dateType}:{}),
  }))).max(20).default([]),
 candidatePreferences:z.strictObject({
  preferredDegree:z.string().trim().max(160).default(""),
  specialization:z.string().trim().max(160).default(""),
  graduationYear:z.number().int().min(1990).max(2050).nullable().default(null),
  minGpa:z.number().min(0).max(10).nullable().default(null),
  city:z.string().trim().max(160).default(""),
 }).prefault({}),
 customEligibilityRules:z.array(z.strictObject({
  label:z.string().trim().min(1).max(160),
  value:z.string().trim().min(1).max(500),
 })).max(20).default([]),
}).superRefine((data,ctx)=>{
 if(data.portal.studentsRegisterSeparately&&(!data.portal.name||!data.portal.url))
  ctx.addIssue({code:"custom",path:["portal"],message:"Enter the separate portal name and HTTPS link."});
 if(new Set(data.skillsWanted.map(s=>s.toLocaleLowerCase("en"))).size!==data.skillsWanted.length)
  ctx.addIssue({code:"custom",path:["skillsWanted"],message:"Skills must be unique."});
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

/** Keep supplemental assessment chronology valid on partial drive edits. */
export function isLegacyAssessmentDeadlineAfterApplication(
 assessmentDeadline:string|null|undefined,
 applicationDeadline:Date|null|undefined,
):boolean {
 if(!assessmentDeadline)return true;
 if(!applicationDeadline)return false;
 const timestamp=Date.parse(assessmentDeadline);
 return Number.isFinite(timestamp)&&timestamp>applicationDeadline.getTime();
}

/** Calendar export for a previously authorized job's legacy important dates.
 * The caller owns the permissioned job read; never use this to fetch jobs by
 * arbitrary identifier. Output is bounded to the existing 20-entry schema.
 * TYPE is preserved in the description, not discarded during the ICS export.
 */
export function legacyPostingImportantDatesIcs(
  entries:readonly {label:string;at:string;type?:string;dateType?:string}[],
  calendarName="Job important dates",
):string {
 const escape=(value:string)=>value.replace(/\\/g,"\\\\")
  .replace(/\r?\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,").slice(0,240);
 const stamp=(date:Date)=>date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
 const events=entries.slice(0,20).flatMap((entry,index)=>{
  const start=new Date(entry.at);
  if(!Number.isFinite(start.getTime())||!entry.label.trim())return [];
  const uid="legacy-important-"+index+"-"+start.getTime()+"@lms-vnext";
  return ["BEGIN:VEVENT","UID:"+uid,"DTSTAMP:"+stamp(start),
   "DTSTART:"+stamp(start),"SUMMARY:"+escape(entry.label.trim()),
   "DESCRIPTION:"+escape(entry.type??entry.dateType??"IMPORTANT_DATE"),"END:VEVENT"];
 });
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//42Students//Job dates//EN",
  "CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:"+escape(calendarName),
  ...events,"END:VCALENDAR",""].join("\r\n");
}
