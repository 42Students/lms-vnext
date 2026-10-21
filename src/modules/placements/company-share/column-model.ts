import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {placementReportCsv} from "../report-model";
export const COMPANY_SHARE_COLUMNS={
 APPLICATION_ID:"Applicant ID",NAME:"Name",ROLL_NUMBER:"Roll number",
 BRANCH:"Branch",UG_BAND:"UG %",TENTH:"10th %",TWELFTH:"12th % / Diploma",
 EMAIL:"Email",PHONE:"Phone",RESUME:"Resume",GITHUB:"GitHub",
 PORTFOLIO:"Portfolio",STAGE:"Stage",
} as const;
export type CompanyShareColumn=keyof typeof COMPANY_SHARE_COLUMNS;
export const DEFAULT_COMPANY_SHARE_COLUMNS:CompanyShareColumn[]=["APPLICATION_ID","NAME","EMAIL"];
const legacyShareColumnMap:Readonly<Record<string,readonly CompanyShareColumn[]>>={
 applicantId:["APPLICATION_ID"],name:["NAME"],roll:["ROLL_NUMBER"],
 branch:["BRANCH"],cgpa:["UG_BAND"],tenth:["TENTH"],
 twelfth:["TWELFTH"],email:["EMAIL"],phone:["PHONE"],
 resume:["RESUME"],github:["GITHUB"],portfolio:["PORTFOLIO"],
 projects:["GITHUB","PORTFOLIO"],stage:["STAGE"],
};
export function safeCompanyShareColumns(raw:unknown):CompanyShareColumn[]{
 if(!Array.isArray(raw)||raw.length===0||raw.length>12)
  return [...DEFAULT_COMPANY_SHARE_COLUMNS];
 const columns:CompanyShareColumn[]=["APPLICATION_ID"];
 for(const value of raw){
  if(typeof value!=="string")return [...DEFAULT_COMPANY_SHARE_COLUMNS];
  const mapped=legacyShareColumnMap[value] ??
    (Object.prototype.hasOwnProperty.call(COMPANY_SHARE_COLUMNS,value)?
     [value as CompanyShareColumn]:null);
  if(!mapped)return [...DEFAULT_COMPANY_SHARE_COLUMNS];
  for(const key of mapped)if(!columns.includes(key))columns.push(key);
 }
 return columns;
}
export const LEGACY_COMPANY_SHARE_STAGE_LABEL:Readonly<Record<string,string>>={
 APPLIED:"Applied",SHORTLISTED:"Shortlisted",ASSESSMENT:"Test",
 INTERVIEW:"Interview",OFFERED:"Offered",HIRED:"Placed",
 WAITLISTED:"Waitlisted",REJECTED:"Not selected",WITHDRAWN:"Withdrawn",
};
export function companyShareStageLabel(status:string|null):string{
 if(!status)return "-";
 return LEGACY_COMPANY_SHARE_STAGE_LABEL[status] ??
  status.toLowerCase().split("_").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");
}
type Candidate={
 applicationId:string;displayName:string|null;email:string|null;
 phone:string|null;rollNumber:string|null;profileDocument:Record<string,unknown>|null;
 branch:string|null;stage:string|null;
 /** Minted by the server after share-token/PIN validation and clean-scan attestation. */
 resumeSignedUrl?:string|null;resumeExpiresAt?:string|null;
 /** Exact grade sharing additionally requires explicit learner consent. */
 shareExactUgGrade?:boolean;
};
function safeHttpsUrl(value:string|null|undefined){
 try{const url=new URL(value??"");return url.protocol==="https:"&&!url.username&&!url.password?url.href:null;}
 catch{return null;}
}
function educationPercentage(raw:unknown,kind:"TENTH"|"TWELFTH"|"UG_BAND",allowExact=false){
 const parsed=learnerProfileDocumentSchema.safeParse(raw??{});
 if(!parsed.success)return null;
 const match=parsed.data.education.find(row=>{
  const label=(row.educationType+" "+row.program+" "+row.qualifyingExam).toUpperCase();
  return kind==="TENTH"?/\b(10TH|SSC|SECONDARY|CLASS 10)\b/.test(label):
   kind==="TWELFTH"?/\b(12TH|INTERMEDIATE|DIPLOMA|HSC|CLASS 12)\b/.test(label):
   /\b(UG|BACHELOR|B\.TECH|BSC|B\.SC|BE|B\.E)\b/.test(label);
 });
 if(!match||match.gradingType!=="Percentage")return null;
 const percent=Number(match.gradeObtained);
 if(!Number.isFinite(percent)||percent<0||percent>100||match.gradeObtained==="")return null;
 if(kind==="UG_BAND"&&!allowExact)return Math.floor(Math.min(99.999,percent)/10)*10+"–"+
   Math.min(100,Math.floor(Math.min(99.999,percent)/10)*10+10)+"%";
 return percent.toFixed(2).replace(/\.00$/,"")+"%";
}
export function projectCompanyShareRows(source:readonly Candidate[],rawColumns:unknown){
 const columns=safeCompanyShareColumns(rawColumns);
 return source.map(row=>{
  const doc=learnerProfileDocumentSchema.safeParse(row.profileDocument??{});
  const profile=doc.success?doc.data:null;
  const values:Record<CompanyShareColumn,string|null>={
   APPLICATION_ID:row.applicationId,NAME:row.displayName?.trim()||"Unnamed learner",
   ROLL_NUMBER:row.rollNumber,BRANCH:row.branch,
   UG_BAND:educationPercentage(row.profileDocument,"UG_BAND",row.shareExactUgGrade===true),
   TENTH:educationPercentage(row.profileDocument,"TENTH"),
   TWELFTH:educationPercentage(row.profileDocument,"TWELFTH"),
   EMAIL:row.email,PHONE:row.phone,
   RESUME:row.resumeSignedUrl && row.resumeExpiresAt &&
     Date.parse(row.resumeExpiresAt)>Date.now()+5000
      ?safeHttpsUrl(row.resumeSignedUrl):"Link not shown",
   GITHUB:safeHttpsUrl(profile?.socialProfiles.githubUrl),
   PORTFOLIO:safeHttpsUrl(profile?.socialProfiles.portfolioUrl),
   STAGE:companyShareStageLabel(row.stage),
  };
  return {applicationId:row.applicationId,
   displayName:values.NAME??"Unnamed learner",
   email:columns.includes("EMAIL")?row.email:null,
   cells:Object.fromEntries(columns.map(key=>[key,values[key]??"-"])) as Partial<Record<CompanyShareColumn,string|null>>,
  };
 });
}
export function companyShareSelectedCsv(
 rows:ReturnType<typeof projectCompanyShareRows>,rawColumns:unknown,truncated:boolean,
){
 const columns=safeCompanyShareColumns(rawColumns);
 const data:(string|null)[][]=rows.map(row=>columns.map(key=>row.cells[key]??null));
 if(truncated)data.unshift(columns.map((_,i)=>i===0?
  "NOTICE: More than 500 shortlisted applicants; CSV truncated":""));
 return placementReportCsv(columns.map(key=>COMPANY_SHARE_COLUMNS[key]),data);
}
