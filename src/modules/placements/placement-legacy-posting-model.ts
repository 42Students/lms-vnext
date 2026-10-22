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

 assessmentUrl:z.union([z.url().max(2048).refine(value=>{
  try {
   const url=new URL(value);
   return (url.protocol==="http:"||url.protocol==="https:")&&
    Boolean(url.hostname)&&!url.username&&!url.password;
  }catch{return false;}
 },"Use HTTP or HTTPS without embedded credentials"),z.literal("")])
  .nullable().optional().default(null).transform(value=>value||null),
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
   // Legacy date-only values mean midnight at the selected Indian college.
   // Do not interpret them as UTC midnight and shift the learner's date.
   at:v.at??(v.date!.length===10?v.date+"T00:00:00+05:30":v.date!),
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

/** Historic company jobs could target an organization without a college,
 * then select batch/class/program/branch per college. A vNext job needs a
 * concrete college and role-scoped membership; never silently pick the first
 * campus or change a legacy org-wide job into a college-only listing. */
export type LegacyJobTargetScope={
 legacyOrganizationId:number;legacyCollegeId:number|null;
 legacyProgramIds:readonly number[];legacyClassIds:readonly number[];
 legacyBatchIds:readonly number[];legacyDepartmentIds:readonly number[];
 importantDates:readonly {label:string;at:string;type?:string;dateType?:string}[];
};
export function legacyJobTargetImportPlan(source:LegacyJobTargetScope,approved:{
 organizationId:string;collegeId:string|null;
 programs:ReadonlyMap<number,string>;classes:ReadonlyMap<number,string>;
 batches:ReadonlyMap<number,string>;departments:ReadonlyMap<number,string>;
}){
 if(!Number.isSafeInteger(source.legacyOrganizationId)||source.legacyOrganizationId<1)
  throw new Error("Legacy job organization has no verified source ID");
 if(source.legacyCollegeId===null||approved.collegeId===null)
  return {status:"REQUIRES_ORG_WIDE_APPROVAL" as const,
   reason:"Organization-wide legacy drives need explicit multi-college grants",
   importantDates:source.importantDates};
 const map=(ids:readonly number[],lookup:ReadonlyMap<number,string>,label:string)=>
  [...new Set(ids)].map(id=>{
   const resolved=lookup.get(id);
   if(!resolved)throw new Error("Unmapped "+label+" for legacy job");
   return resolved;
  });
 return {status:"SCOPED" as const,organizationId:approved.organizationId,
  collegeId:approved.collegeId,
  programIds:map(source.legacyProgramIds,approved.programs,"program"),
  sectionIds:map(source.legacyClassIds,approved.classes,"class"),
  cohortIds:map(source.legacyBatchIds,approved.batches,"batch"),
  departmentIds:map(source.legacyDepartmentIds,approved.departments,"branch"),
  importantDates:placementLegacyPostingDetailsSchema.shape.importantDates.parse(
   source.importantDates),
 };
}


/** Historic posting imports may have one global job with multiple role
 * packages. Only a verified same-college relationship/season and a
 * per-role primary package can be published. Eligibility JSON is mapped
 * to the distinct policy service, never entrusted to display metadata. */
export function legacyJobRelationalParts(input:{
  roleOptions:readonly {legacyRoleId:number;title:string;ctcLpa:string|null}[];
  previousRequestId:number|null;eligibility:unknown;
  resolvedRequestId:string|null;hasVerifiedEligibilityPolicy:boolean;
}){
 if(!input.hasVerifiedEligibilityPolicy)
  throw new Error("Legacy eligibility requires approved policy mapping");
 if(input.previousRequestId!==null&&!input.resolvedRequestId)
  throw new Error("Prior recruiter request must be mapped before publication");
 const roles=input.roleOptions.map((role,i)=>{
  if(!Number.isSafeInteger(role.legacyRoleId)||role.legacyRoleId<1||
     !role.title.trim()||role.title.length>100)
   throw new Error("Unmapped role package");
  const pay=role.ctcLpa===null?null:Number(role.ctcLpa);
  if(pay!==null&&(!Number.isFinite(pay)||pay<0||pay>10000))
   throw new Error("Invalid historic role package pay");
  return {sourceRoleId:role.legacyRoleId,position:i,
    title:role.title.trim(),ctcLpa:role.ctcLpa,
    isPrimary:i===0};
 });
 if(!roles.length)throw new Error("At least one primary role is required");
 return {roles,previousRequestId:input.resolvedRequestId,
   eligibilityMapping:"REQUIRES_SCOPED_POLICY_REPLAY" as const};
}
