import {z} from "zod";
import {DRIVE_PAY_CATEGORIES,DRIVE_PAY_CATEGORY_REASON_MAX,drivePayCategoryOverrideIssue} from "./drive-pay-category-model";
export const tpoDriveEditSchema=z.object({
 confirmed:z.literal(true),
 wantedSkills:z.array(z.string().trim().min(1).max(50)).max(30).refine(
  rows=>new Set(rows.map(v=>v.toLocaleLowerCase("en-IN"))).size===rows.length,
  "Choose each wanted skill once.").optional(),
 notifyApplicants:z.boolean().default(false),
 applicationDeadline:z.iso.datetime({offset:true}).nullable().optional(),
 minCgpaHundredths:z.number().int().min(0).max(1000).nullable().optional(),
 verifiedMarksOnly:z.boolean().optional(),
 minTenthPctBasisPoints:z.number().int().min(0).max(10000).nullable().optional(),
 minTwelfthPctBasisPoints:z.number().int().min(0).max(10000).nullable().optional(),
 minDiplomaPctBasisPoints:z.number().int().min(0).max(10000).nullable().optional(),
 minUndergraduatePctBasisPoints:z.number().int().min(0).max(10000).nullable().optional(),
 minPostgraduatePctBasisPoints:z.number().int().min(0).max(10000).nullable().optional(),
 allowedPassingYears:z.array(z.number().int().min(2000).max(2100)).max(101).optional(),
 allowedProgramIds:z.array(z.string().uuid()).max(100).refine(
  ids=>new Set(ids).size===ids.length,"Choose each program once.").optional(),
 portal:z.strictObject({
  studentsRegisterSeparately:z.boolean(),
  name:z.string().trim().max(160),
  url:z.string().trim().max(2000),
 }).superRefine((portal,ctx)=>{
  if(!portal.studentsRegisterSeparately)return;
  if(!portal.name)ctx.addIssue({code:"custom",path:["name"],message:"Enter the portal name."});
  try{
   const url=new URL(portal.url);
   if(url.protocol!=="https:"||!url.hostname||url.username||url.password)
    throw new Error("Invalid HTTPS portal link");
  }catch{
   ctx.addIssue({code:"custom",path:["url"],message:"Enter a secure HTTPS employer portal link."});
  }
 }).optional(),
 jobTypeLabel:z.string().trim().max(40).nullable().optional(),
 recruiterDriveMode:z.enum(["ON_CAMPUS","OFF_CAMPUS"]).optional(),
 workMode:z.enum(["ONSITE","HYBRID","REMOTE"]).optional(),
 employmentType:z.enum(["FULL_TIME","INTERNSHIP","CONTRACT"]).optional(),
 allowedCohortIds:z.array(z.string().uuid()).max(100)
  .refine(ids=>new Set(ids).size===ids.length,"Select each eligible batch only once.").optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true})
  .transform(value=>new Date(value).toISOString()),
 reason:z.string().trim().min(10).max(1000),
 title:z.string().trim().min(2).max(200),description:z.string().trim().min(1).max(20000),
 locations:z.array(z.string().trim().min(1).max(120)).max(20),
 openings:z.number().int().positive().max(100000).nullable(),
 minimumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
 maximumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
 fixedCtcLpa:z.number().min(0).max(1000).nullable(),
 variableCtcLpa:z.number().min(0).max(1000).nullable(),
 stipendPerMonthInr:z.number().int().min(0).max(10000000).nullable(),
 isDream:z.boolean(),
 // Legacy manual pay-category override. Absent keeps the stored tier; null
 // clears it so the tier is worked out from the highest CTC again.
 legacyJobCategory:z.enum(DRIVE_PAY_CATEGORIES).nullable().optional(),
 categoryOverrideReason:z.string().trim().max(DRIVE_PAY_CATEGORY_REASON_MAX).nullable().optional(),
}).strict().superRefine((input,ctx)=>{
 if(input.legacyJobCategory===undefined&&input.categoryOverrideReason===undefined)return;
 const issue=drivePayCategoryOverrideIssue(input);
 if(issue)ctx.addIssue({code:"custom",path:[issue.path],message:issue.message});
});
export type TpoDriveEditInput=z.infer<typeof tpoDriveEditSchema>;
export function evaluateTpoDriveEdit(status:string,seasonStatus:string|null,input:TpoDriveEditInput){
 // Historical closed/cancelled drives stay frozen; a completed season alone
 // is not a reason to hide an otherwise valid published job correction.
 if(!["DRAFT","PUBLISHED"].includes(status))return "READ_ONLY" as const;
 // An inactive recruitment season freezes a draft. Audited corrections to
 // already-published drives remain permitted without reopening the season.
 if(status==="DRAFT"&&seasonStatus!=="ACTIVE")return "READ_ONLY" as const;
 if(status==="PUBLISHED"&&input.applicationDeadline===null)return "INVALID_DEADLINE" as const;
 if(input.minimumAnnualCtcInr!==null&&input.maximumAnnualCtcInr!==null&&
   input.maximumAnnualCtcInr<input.minimumAnnualCtcInr)return "INVALID_CTC" as const;
 if(input.maximumAnnualCtcInr!==null&&
   (input.fixedCtcLpa??0)+(input.variableCtcLpa??0)>input.maximumAnnualCtcInr/100000)
   return "INVALID_CTC" as const;
 if(new Set(input.locations.map(x=>x.toLowerCase())).size!==input.locations.length)
   return "DUPLICATE_LOCATION" as const;
 return "ALLOW" as const;
}
