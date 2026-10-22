import {describe,expect,it} from "vitest";
import {hrDriveDraftSchema,hrDriveDraftQuerySchema,emptyHrDriveDraft,hrDraftFromAuthorizedJob}
 from "@/modules/placements/hr-drive-draft-model";

const id="123e4567-e89b-42d3-a456-426614174001";
const base=()=>({...emptyHrDriveDraft(),title:"Software engineer",ctcLpa:"12"});
const job={
 title:"Software engineer",description:"Build durable services",locations:["Hyderabad"],
 employmentType:"FULL_TIME",workMode:"ONSITE",
 minimumAnnualCtcInr:1_000_000,maximumAnnualCtcInr:2_000_000,
};

describe("HR-BREAK-drive-payload-01: TPO review-safe recruiter job drafts",()=>{
 it("valid request payload survives schema validation with correctly preserved compensation",()=>{
  const parsed=hrDriveDraftSchema.parse(base());
  expect(parsed.title).toBe("Software engineer");
  expect(parsed.ctcLpa).toBe("12");
  expect(parsed.driveMode).toBe("ON_CAMPUS");
 });
 it("off-campus drives require a safe HTTPS application URL, never javascript, credentials or an on-campus link",()=>{
  for(const externalApplicationUrl of ["","http://careers.example/apply",
   "javascript:alert(1)","https://user:pass@careers.example/apply","file:///tmp/private",
   "https://localhost/apply","https://localhost./apply","https://dev.local./apply",
   "https://127.0.0.1/apply","https://10.0.0.2/apply","https://192.168.1.1/apply",
   "https://169.254.169.254/latest/meta-data/"]){
   expect(hrDriveDraftSchema.safeParse({...base(),driveMode:"OFF_CAMPUS",externalApplicationUrl}).success).toBe(false);
  }
  expect(hrDriveDraftSchema.safeParse({...base(),driveMode:"OFF_CAMPUS",
   externalApplicationUrl:"https://careers.example/apply"}).success).toBe(true);
  expect(hrDriveDraftSchema.safeParse({...base(),driveMode:"ON_CAMPUS",
   externalApplicationUrl:"https://careers.example/apply"}).success).toBe(false);
  const copied=hrDraftFromAuthorizedJob({...job,recruiterDriveMode:"OFF_CAMPUS",
   externalApplicationUrl:"https://localhost./apply"},[]);
  expect(copied.externalApplicationUrl).toBe("");
  expect(hrDriveDraftSchema.safeParse(copied).success).toBe(false);
 });
 it("preserves a legacy off-campus classification and its reviewed application URL on Hire Again",()=>{
  const copied=hrDraftFromAuthorizedJob({...job,
   legacyDriveMode:"OFF_CAMPUS",
   externalApplicationUrl:"https://careers.example/apply"},[]);
  expect(copied.driveMode).toBe("OFF_CAMPUS");
  expect(copied.externalApplicationUrl).toBe("https://careers.example/apply");
  expect(hrDriveDraftSchema.safeParse(copied).success).toBe(true);

  const explicitlyCampus=hrDraftFromAuthorizedJob({...job,
   legacyDriveMode:"ON_CAMPUS",recruiterDriveMode:"OFF_CAMPUS",
   externalApplicationUrl:"https://careers.example/apply"},[]);
  expect(explicitlyCampus.driveMode).toBe("ON_CAMPUS");
  expect(explicitlyCampus.externalApplicationUrl).toBe("");
  expect(hrDriveDraftSchema.safeParse(explicitlyCampus).success).toBe(true);

  const unsafe=hrDraftFromAuthorizedJob({...job,
   legacyDriveMode:"OFF_CAMPUS",
   externalApplicationUrl:"javascript:alert(1)"},[]);
  expect(unsafe.driveMode).toBe("OFF_CAMPUS");
  expect(unsafe.externalApplicationUrl).toBe("");
  expect(hrDriveDraftSchema.safeParse(unsafe).success).toBe(false);
 });
 it("internships need stated stipend and full-time compensation cannot silently mismatch its parts",()=>{
  expect(hrDriveDraftSchema.safeParse({...base(),employmentType:"INTERNSHIP",stipendMonthlyInr:""}).success).toBe(false);
  expect(hrDriveDraftSchema.safeParse({...base(),employmentType:"INTERNSHIP",stipendMonthlyInr:"25000"}).success).toBe(true);
  expect(hrDriveDraftSchema.safeParse({...base(),ctcLpa:"12",fixedLpa:"10",variableLpa:"5"}).success).toBe(false);
  expect(hrDriveDraftSchema.safeParse({...base(),ctcLpa:"12",fixedLpa:"10",variableLpa:"2"}).success).toBe(true);
  expect(hrDriveDraftSchema.safeParse({...base(),minimumAnnualCtcInr:"2000000",maximumAnnualCtcInr:"1000000"}).success).toBe(false);
 });
 it("duplicate/malformed hiring rounds and out-of-range academic, bond and eligibility data fail closed",()=>{
  const duplicate=[{kind:"INTERVIEW" as const,name:"Technical"},{kind:"TEST" as const,name:" technical "}];
  for(const patch of [{rounds:duplicate},{rounds:Array(13).fill({kind:"TEST",name:"Test"})},
   {rounds:[{kind:"ADMIN",name:"Test"}]},{minimumCgpa:"10.5"},
   {minimumCgpa:"11"},{bondMonths:"121"},{maximumActiveBacklogs:"100"},
   {branches:Array(31).fill("CS")},{passingYear:"1900"},{passingYear:"202"},
   {externalApplicationUrl:"<script>"},{superAdmin:true}]){
   expect(hrDriveDraftSchema.safeParse({...base(),...patch}).success).toBe(false);
  }
 });
 it("draft deep link can choose just one previously authorized source/request action",()=>{
  expect(hrDriveDraftQuerySchema.safeParse({collegeId:id,from:id}).success).toBe(true);
  for(const invalid of [{from:id,fix:id},{edit:id,copy:id},{collegeId:"../college"},
   {collegeId:id,forcePublish:true}]){
   expect(hrDriveDraftQuerySchema.safeParse(invalid).success).toBe(false);
  }
 });
 it("Hire Again builds an editable draft only from authorized job data and strips malformed external URLs",()=>{
  const safe=hrDraftFromAuthorizedJob({...job,
   recruiterDriveMode:"OFF_CAMPUS",externalApplicationUrl:"javascript:alert(1)",
   eligibleBranches:[" CS ","EE"],eligiblePassingYear:2027},
   [{kind:"INTERVIEW",name:"Technical"},{kind:"ADMIN",name:"Sensitive"}]);
  expect(safe.externalApplicationUrl).toBe("");
  expect(safe.branches).toEqual(["CS","EE"]);
  expect(safe.rounds).toEqual([{kind:"INTERVIEW",name:"Technical"}]);
  expect(safe.minimumAnnualCtcInr).toBe("1000000");
  expect(safe.maximumAnnualCtcInr).toBe("2000000");
  expect(hrDriveDraftSchema.safeParse(safe).success).toBe(false);
 });
});