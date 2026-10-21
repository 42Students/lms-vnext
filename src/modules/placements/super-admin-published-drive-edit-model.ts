import {z} from "zod";
export const superAdminPublishedDriveEditSchema=z.strictObject({
 confirmed:z.literal(true),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 reason:z.string().trim().min(10).max(1000),
 title:z.string().trim().min(3).max(100),
 description:z.string().trim().min(1).max(15000).refine(value=>value.replace(/<[^>]*>/g,"").trim().length>0,"Please enter job description."),
 companyRelationshipId:z.uuid(),
 assessmentUrl:z.union([z.url().refine(v=>/^https?:\/\//i.test(v),"Use a valid HTTP(S) URL"),z.literal("")]),
 assessmentDeadline:z.iso.datetime({offset:true}).nullable(),
 candidatePreferences:z.strictObject({
  preferredDegree:z.string().trim().max(160),
  specialization:z.string().trim().max(160),
  graduationYear:z.number().int().min(1990).max(2050).nullable(),
  minGpa:z.number().min(0).max(10).nullable(),
  city:z.string().trim().max(160),
 }),
 jobTypeLabel:z.string().trim().min(1,"Please select job type").max(120),
 employmentType:z.enum(["FULL_TIME","INTERNSHIP","CONTRACT"]),
 workMode:z.enum(["ONSITE","HYBRID","REMOTE"]),
 responsibilities:z.string().trim().max(15000),
 locations:z.array(z.string().trim().min(1).max(120)).max(20),
 applicationDeadline:z.iso.datetime({offset:true}),
 openings:z.number().int().min(1).max(100000).nullable(),
 minimumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
 maximumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
}).superRefine((v,ctx)=>{
 if(v.assessmentDeadline&&Date.parse(v.assessmentDeadline)<=Date.parse(v.applicationDeadline))
  ctx.addIssue({code:"custom",path:["assessmentDeadline"],message:"Assessment deadline must follow application deadline."});
 if(v.maximumAnnualCtcInr!=null&&v.minimumAnnualCtcInr!=null&&
  v.maximumAnnualCtcInr<v.minimumAnnualCtcInr)
  ctx.addIssue({code:"custom",path:["maximumAnnualCtcInr"],message:"Maximum CTC must be at least the minimum."});
 if(new Set(v.locations.map(s=>s.toLowerCase())).size!==v.locations.length)
  ctx.addIssue({code:"custom",path:["locations"],message:"Locations must be unique."});
});
