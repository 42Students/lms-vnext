import { z } from "zod";
import { safeRecruiterExternalLink } from "./recruiter-applicant-shared-links-model";

export const hrDriveDraftQuerySchema = z.strictObject({
  collegeId: z.string().uuid().optional(),
  from: z.string().uuid().optional(),
  fix: z.string().uuid().optional(),
  edit: z.string().uuid().optional(),
  copy: z.string().uuid().optional(),
}).refine((input) => [input.from,input.fix,input.edit,input.copy].filter(Boolean).length<=1, {
  message: "Choose only one of Hire Again, Fix and Resend, Edit your request or Hire again with changes",
});

const round = z.strictObject({
  kind: z.enum(["TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW"]),
  name: z.string().trim().max(120)
   .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid round name"}),
});
export const hrDriveDraftSchema = z.strictObject({
  title: z.string().trim().min(3,"Enter a role title").max(200)
   .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid role title"}),
  description: z.string().trim().max(5000),
  location: z.string().trim().max(180)
   .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid location"}),
  employmentType: z.enum(["FULL_TIME", "INTERNSHIP", "INTERNSHIP_FULL_TIME", "CONTRACT"]),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE", "NO_PREFERENCE"]),
  driveMode: z.enum(["ON_CAMPUS","OFF_CAMPUS"]).default("ON_CAMPUS"),
  externalApplicationUrl: z.string().trim().max(2000).refine(value=>
    !value || safeRecruiterExternalLink(value)!==null,
  "Enter a public HTTPS application link").default(""),
  ctcLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
  fixedLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
  variableLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
  stipendMonthlyInr: z.string().regex(/^\d{0,9}$/).default(""),
  minimumAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  maximumAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  minimumCgpa: z.string().regex(/^(?:|(?:10(?:\.0{1,2})?|[0-9](?:\.[0-9]{1,2})?))$/),
  fixedAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  variableAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  bondMonths: z.string().regex(/^\d{0,3}$/),
  bondAmountInr: z.string().regex(/^\d{0,9}$/),
  maximumActiveBacklogs: z.string().regex(/^\d{0,2}$/),
  branches: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  passingYear: z.string().regex(/^(?:|20\d{2})$/,"Enter a valid passing year").default(""),
  rounds: z.array(round).max(100,"At most 100 hiring rounds")
   .transform(rows=>rows.filter(item=>item.name.trim().length>0)),
}).superRefine((data, ctx) => {
  if(data.driveMode==="OFF_CAMPUS"&&!data.externalApplicationUrl){
    ctx.addIssue({code:"custom",path:["externalApplicationUrl"],
      message:"Application website is required for off-campus drives"});
  }
  if(data.driveMode==="ON_CAMPUS"&&data.externalApplicationUrl){
    ctx.addIssue({code:"custom",path:["externalApplicationUrl"],
      message:"An application website is only valid for off-campus drives"});
  }
  const uniqueRoundNames = new Set<string>();
  for (const [index, item] of data.rounds.entries()) {
    if(item.name.length<2){
      ctx.addIssue({code:"custom",path:["rounds",index,"name"],message:"Enter a round name"});
      continue;
    }
    const label = item.name.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
    if (uniqueRoundNames.has(label)) {
      ctx.addIssue({ code:"custom",path:["rounds",index,"name"],
        message:"Give each hiring round a distinct name" });
    }
    uniqueRoundNames.add(label);
  }
  if ((data.employmentType==="INTERNSHIP"||data.employmentType==="INTERNSHIP_FULL_TIME") && (!data.stipendMonthlyInr||Number(data.stipendMonthlyInr)<=0)) {
    ctx.addIssue({code:"custom",path:["stipendMonthlyInr"],message:"Students need to know the stipend"});
  }
  if (data.employmentType!=="INTERNSHIP" && !data.ctcLpa &&
      !data.minimumAnnualCtcInr && !data.maximumAnnualCtcInr) {
    ctx.addIssue({code:"custom",path:["ctcLpa"],message:"CTC is required"});
  }
  if (data.ctcLpa && Number(data.fixedLpa||0)+Number(data.variableLpa||0)>Number(data.ctcLpa)){
    ctx.addIssue({code:"custom",path:["fixedLpa"],message:"Fixed and variable add up to more than the CTC"});
  }
  // Fixed and variable are optional detail components. Legacy allows them
  // to total less than the advertised CTC (other components may be present);
  // only prevent a claimed breakdown from exceeding the advertised package.
  const min = data.minimumAnnualCtcInr ? Number(data.minimumAnnualCtcInr) : null;
  const max = data.maximumAnnualCtcInr ? Number(data.maximumAnnualCtcInr) : null;
  if (data.bondMonths && Number(data.bondMonths) > 120) {
    ctx.addIssue({ code: "custom", path: ["bondMonths"], message: "Bond must not exceed 120 months" });
  }
  const fixed = data.fixedAnnualCtcInr ? Number(data.fixedAnnualCtcInr) : null;
  const variable = data.variableAnnualCtcInr ? Number(data.variableAnnualCtcInr) : null;
  if (fixed !== null && variable !== null) {
    const combined = fixed + variable;
    if (min !== null && combined < min) {
      ctx.addIssue({ code: "custom", path: ["fixedAnnualCtcInr"],
        message: "Fixed plus variable CTC must reach the stated minimum annual CTC" });
    }
    if (max !== null && combined > max) {
      ctx.addIssue({ code: "custom", path: ["variableAnnualCtcInr"],
        message: "Fixed plus variable CTC must not exceed the stated maximum annual CTC" });
    }
  }
  if (min !== null && max !== null && max < min) {
    ctx.addIssue({ code: "custom", path: ["maximumAnnualCtcInr"], message: "Maximum CTC must be at least minimum CTC" });
  }
});
export type HrDriveDraft = z.input<typeof hrDriveDraftSchema>;

export function emptyHrDriveDraft(): HrDriveDraft {
  return {
    title: "", description: "", location: "",
    employmentType: "FULL_TIME", workMode: "ONSITE", ctcLpa:"",fixedLpa:"",variableLpa:"",stipendMonthlyInr:"", driveMode:"ON_CAMPUS",externalApplicationUrl:"",
    minimumAnnualCtcInr: "", maximumAnnualCtcInr: "", minimumCgpa: "",
    fixedAnnualCtcInr: "", variableAnnualCtcInr: "", bondMonths: "",
    bondAmountInr: "", maximumActiveBacklogs: "", branches: [], passingYear: "",
    rounds: [{ kind: "INTERVIEW", name: "Interview" }],
  };
}

export function hrDraftFromAuthorizedJob(job: {
  title: string; description: string; locations: readonly string[];
  employmentType: string; workMode: string;
  recruiterDriveMode?: string; externalApplicationUrl?:string|null;
  eligibleBranches?:readonly string[];eligiblePassingYear?:number|null;
  ctcLpa?:string|null;fixedCtcLpa?:string|null;variableCtcLpa?:string|null;
  stipendPerMonthInr?:number|null;
  minimumAnnualCtcInr: number | null; maximumAnnualCtcInr: number | null;
}, rounds: readonly { kind: string; name: string }[]): HrDriveDraft {
  const base = emptyHrDriveDraft();
  const safeExternalLink=safeRecruiterExternalLink(job.externalApplicationUrl)??"";
  const type = z.enum(["FULL_TIME", "INTERNSHIP", "INTERNSHIP_FULL_TIME", "CONTRACT"]).safeParse(job.employmentType);
  const mode = z.enum(["ONSITE", "HYBRID", "REMOTE", "NO_PREFERENCE"]).safeParse(job.workMode);
  const allowedRoundKinds = z.enum(["TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW"]);
  const validRounds = rounds.flatMap((item) => {
    const kind = allowedRoundKinds.safeParse(item.kind);
    return kind.success && item.name.trim().length >= 2
      ? [{ kind: kind.data, name: item.name.trim() }] : [];
  });
  return {
    ...base,
    title: job.title,
    description: job.description,
    location: job.locations[0] ?? "",
    employmentType: type.success ? type.data : base.employmentType,
    workMode: mode.success ? mode.data : base.workMode,
    driveMode:job.recruiterDriveMode==="OFF_CAMPUS"?"OFF_CAMPUS":"ON_CAMPUS",
    externalApplicationUrl:job.recruiterDriveMode==="OFF_CAMPUS"?safeExternalLink:"",
    branches:(job.eligibleBranches??[]).map(value=>value.trim()).filter(Boolean).slice(0,30),
    passingYear:job.eligiblePassingYear?.toString()??"",
    ctcLpa:job.ctcLpa??"",fixedLpa:job.fixedCtcLpa??"",
    variableLpa:job.variableCtcLpa??"",
    stipendMonthlyInr:job.stipendPerMonthInr?.toString()??"",
    minimumAnnualCtcInr: job.minimumAnnualCtcInr?.toString() ?? "",
    maximumAnnualCtcInr: job.maximumAnnualCtcInr?.toString() ?? "",
    rounds: validRounds.length ? validRounds.slice(0, 12) : base.rounds,
  };
}
