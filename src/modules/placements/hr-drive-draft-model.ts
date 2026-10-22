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
/** Legacy optional rounds are omitted, not persisted with a blank name. */
/** Legacy controls, with explicit bounded limits for this vNext request. */
export const HR_DRIVE_ROUND_LIMIT=100;
export const HR_DRIVE_BRANCH_LIMIT=30;
export const LEGACY_HR_DRIVE_MODES=[
 {value:"ON_CAMPUS",label:"On campus"},
 {value:"POOL",label:"Pool"},
 {value:"OFF_CAMPUS",label:"Off campus"},
] as const;
export const LEGACY_HR_DRIVE_FORM_LABELS={
 description:"Description (optional)",descriptionRows:4,
 paySection:"Pay packages",packageName:"Package name",
 ctc:"CTC (LPA)",fixed:"Fixed",variable:"Variable",
 joiningBonus:"Joining bonus",stipend:"Stipend / month (internship)",
 duration:"Duration (months)",
} as const;
export const HR_DRIVE_CTC_STEP=0.1;
export const HR_DRIVE_PACKAGE_MONEY_STEP=0.5;
const payPackage = z.strictObject({
 name: z.string().trim().min(1).max(100),
 ctcLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
 fixedLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
 variableLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
 joiningBonusLpa: z.string().regex(/^(?:|\d{1,4}(?:\.\d{1,2})?)$/).default(""),
 stipendMonthlyInr: z.string().regex(/^\d{0,9}$/).default(""),
 internshipMonths: z.coerce.number().int().min(1).max(120).optional(),
}).superRefine((item, ctx) => {
 if(item.ctcLpa&&Number(item.fixedLpa)+Number(item.variableLpa)>Number(item.ctcLpa))
  ctx.addIssue({code:"custom",path:["fixedLpa"],message:"Fixed and variable must not exceed package CTC"});
 if(!item.ctcLpa && (!item.stipendMonthlyInr || Number(item.stipendMonthlyInr)<=0)){
  ctx.addIssue({code:"custom",path:["ctcLpa"],
   message:"Set the pay (CTC or stipend) for at least one package"});
 }
});

export const hrDriveDraftSchema = z.strictObject({
  title: z.string().trim().min(3,"Enter a role title").max(200)
   .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid role title"}),
  description: z.string().trim().max(5000),
  /** Retain original JD link for approved legacy drive imports. */
  jdUrl: z.string().trim().max(2000).refine(value=>
    !value || safeRecruiterExternalLink(value)!==null,
    "Enter a public HTTPS job description link").optional(),
  /** Verified private JD object; signed GET links are never stored in drafts. */
  jdObjectKey: z.string().regex(/^private\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/placement-document\/[0-9a-f-]{36}$/i,
    "Upload the job description again").optional(),
  location: z.string().trim().max(180)
   .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid location"}),
  employmentType: z.enum(["FULL_TIME", "INTERNSHIP", "INTERNSHIP_FULL_TIME", "CONTRACT"]),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE", "NO_PREFERENCE"]),
  driveMode: z.enum(["ON_CAMPUS","POOL","OFF_CAMPUS"]).default("ON_CAMPUS"),
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
  branches: z.array(z.string().trim().min(1).max(120)).max(HR_DRIVE_BRANCH_LIMIT,"At most 30 branches; contact the placement cell for wider eligibility").default([]),
  passingYear: z.string().regex(/^(?:|(?:20\d{2}|2100))$/,"Enter a valid passing year").default(""),
  /** Multi-select years are separate from the older single-year form control. */
  passingYears: z.array(z.number().int().min(2000).max(2100)).max(101)
   .refine(years=>new Set(years).size===years.length,
     "Choose each passing year once").optional(),
  payPackages: z.array(payPackage).max(25).optional(),
  rounds: z.array(round).max(HR_DRIVE_ROUND_LIMIT,"At most 100 hiring rounds")
   .transform(rows=>rows.filter(item=>item.name.trim().length>0)),
}).superRefine((data, ctx) => {
  if(data.driveMode==="OFF_CAMPUS"&&!data.externalApplicationUrl){
    ctx.addIssue({code:"custom",path:["externalApplicationUrl"],
      message:"Application website is required for off-campus drives"});
  }
  if(data.driveMode!=="OFF_CAMPUS"&&data.externalApplicationUrl){
    ctx.addIssue({code:"custom",path:["externalApplicationUrl"],
      message:"An application website is only valid for off-campus drives"});
  }
  if(data.payPackages?.length){
    const seen=new Set<string>();
    for(const [index,item] of data.payPackages.entries()){
      const key=item.name.normalize("NFKC").toLocaleLowerCase("en-IN");
      if(seen.has(key))
        ctx.addIssue({code:"custom",path:["payPackages",index,"name"],
          message:"Give each pay package a distinct name"});
      seen.add(key);
    }
    if(!data.payPackages.some(item=>
       Number(item.ctcLpa)>0 || Number(item.stipendMonthlyInr)>0)){
      ctx.addIssue({code:"custom",path:["payPackages"],
       message:"Set the pay (CTC or stipend) for at least one package"});
    }
  }
  if(data.passingYears?.length && data.passingYear &&
      !data.passingYears.includes(Number(data.passingYear))){
   ctx.addIssue({code:"custom",path:["passingYear"],
    message:"The selected passing year must be among the passing years"});
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
  if (data.employmentType==="INTERNSHIP" && (!data.stipendMonthlyInr||Number(data.stipendMonthlyInr)<=0) &&
      !data.payPackages?.some(item=>Number(item.stipendMonthlyInr)>0)) {
    ctx.addIssue({code:"custom",path:["stipendMonthlyInr"],message:"Students need to know the stipend"});
  }
  if (data.employmentType!=="INTERNSHIP" && !data.ctcLpa &&
      !data.payPackages?.some(item=>Number(item.ctcLpa)>0)) {
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
    title: "", description: "", jdUrl: "", location: "",
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
  recruiterDriveMode?: string; legacyDriveMode?:string|null; externalApplicationUrl?:string|null;
  eligibleBranches?:readonly string[];eligiblePassingYear?:number|null;
  eligiblePassingYears?:readonly number[];jdUrl?:string|null;
  ctcLpa?:string|null;fixedCtcLpa?:string|null;variableCtcLpa?:string|null;
  stipendPerMonthInr?:number|null;
  minimumAnnualCtcInr: number | null; maximumAnnualCtcInr: number | null;
}, rounds: readonly { kind: string; name: string }[]): HrDriveDraft {
  const base = emptyHrDriveDraft();
  const safeExternalLink=safeRecruiterExternalLink(job.externalApplicationUrl)??"";
  // Legacy driveMode is the source-of-truth when present. A historical
  // off-campus drive without recruiterDriveMode must keep its application URL.
  const driveMode = job.legacyDriveMode==="ON_CAMPUS" ||
    job.legacyDriveMode==="POOL" || job.legacyDriveMode==="OFF_CAMPUS"
      ? job.legacyDriveMode
      : job.recruiterDriveMode==="OFF_CAMPUS" ? "OFF_CAMPUS" : "ON_CAMPUS";
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
    jdUrl: safeRecruiterExternalLink(job.jdUrl) ?? "",
    location: job.locations[0] ?? "",
    employmentType: type.success ? type.data : base.employmentType,
    workMode: mode.success ? mode.data : base.workMode,
    driveMode,
    externalApplicationUrl:driveMode==="OFF_CAMPUS"?safeExternalLink:"",
    // Keep every authorized branch so the editor can report its 30-branch limit.
    // Never issue a narrower copy by silently discarding eligibility rules.
    branches:(job.eligibleBranches??[]).map(value=>value.trim()).filter(Boolean),
    passingYear:job.eligiblePassingYear?.toString()??"",
    // Invalid historical years must be corrected explicitly. Never silently
    // narrow an authorized eligibility audience while copying the drive.
    passingYears:job.eligiblePassingYears ? [...job.eligiblePassingYears] : undefined,
    // Existing jobs may predate the standalone legacy LPA field; carry the
    // authorized advertised salary into the required CTC control for Hire Again.
    ctcLpa:job.ctcLpa || (job.maximumAnnualCtcInr && job.maximumAnnualCtcInr>0
      ?String(Number((job.maximumAnnualCtcInr/100000).toFixed(2)))
      :job.minimumAnnualCtcInr && job.minimumAnnualCtcInr>0
       ?String(Number((job.minimumAnnualCtcInr/100000).toFixed(2))):""),
    fixedLpa:job.fixedCtcLpa??"",
    variableLpa:job.variableCtcLpa??"",
    stipendMonthlyInr:job.stipendPerMonthInr?.toString()??"",
    minimumAnnualCtcInr: job.minimumAnnualCtcInr?.toString() ?? "",
    maximumAnnualCtcInr: job.maximumAnnualCtcInr?.toString() ?? "",
    // An authorized job with no process rounds stays round-free. Do not
    // invent an Interview round when cloning an existing legacy drive.
    // A NEW draft still offers one editable Interview row by default.
    // Preserve all existing authorized rounds. More than 100 stays visible but
    // invalid until the recruiter explicitly removes excess rows.
    rounds: validRounds,
  };
}

/** Never silently discard imported branch choices past the editor's limit. */
export function parseHrDraftLegacyBranchTags(raw:string):string[]{
 const tags=[...new Map(raw.split(",").map(value=>value.trim()).filter(Boolean)
  .map(value=>[value.toLocaleLowerCase("en-IN"),value] as const)).values()];
 if(tags.length>HR_DRIVE_BRANCH_LIMIT||tags.some(v=>v.length>120))
  throw new Error("Enter at most 30 branches with names up to 120 characters.");
 return tags;
}


/** Persist exact per-package historical CTC. The relational role-option
 * stores a four-decimal LPA string; old integer-INR minimum/maximum columns
 * cannot reconstruct package detail or distinguish blank from zero.
 * Converting LPA to whole INR uses half-up rounding (non-negative values),
 * not binary floating point, with explicit int32 overflow protection. */
export function normalizedLegacyHrPackagePay(input:{
 ctcLpa:string|null;stipendMonthlyInr:string|null;internshipMonths:number|null;
}){
 const ctc=input.ctcLpa?.trim()??"";
 if(ctc&&!/^(?:0|[1-9]\d{0,4})(?:\.\d{1,4})?$/.test(ctc))
  throw new Error("CTC must be a non-negative LPA value with at most four decimals");
 let ctcInr:number|null=null;
 if(ctc){
  const [whole,fraction=""]=ctc.split(".");
  const units=BigInt(whole ?? "")*10_000n+BigInt(fraction.padEnd(4,"0"));
  const rupees=(units*100000n+5000n)/10000n;
  if(rupees>2147483647n)throw new Error("CTC exceeds storage capacity");
  ctcInr=Number(rupees);
 }
 const stipend=input.stipendMonthlyInr?.trim()??"";
 if(stipend&&!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(stipend))
  throw new Error("Monthly stipend needs at most two decimals");
 if(input.internshipMonths!==null&&(
    !Number.isSafeInteger(input.internshipMonths)||
    input.internshipMonths<1||input.internshipMonths>120))
  throw new Error("Internship duration must be 1–120 months");
 if(stipend&&!input.internshipMonths)
  throw new Error("Stipend package requires an explicit duration");
 if(!ctc&&!stipend)throw new Error("Pay package needs CTC or monthly stipend");
 return {ctcLpa:ctc||null,ctcInr,
  stipendPerMonthInr:stipend||null,stipendMonths:input.internshipMonths,
  /** A source blank stays NULL, while a literal zero remains zero. */
  blankCtc:!ctc,blankStipend:!stipend};
}
/** Importer must store every package in its original zero-based ordinal and
 * select exactly one ACTIVE primary package before allowing publication. */
export function legacyHrPackagesWithPrimary<T extends {
 name:string;ctcLpa:string|null;stipendMonthlyInr:string|null;
 internshipMonths:number|null;
}>(source:readonly T[]){
 if(source.length<1||source.length>25)
  throw new Error("A drive must have 1–25 pay packages");
 const names=new Set<string>();
 return source.map((item,index)=>{
  const name=item.name.trim();
  if(!name||name.length>100)throw new Error("Package name is required");
  const key=name.normalize("NFKC").toLocaleLowerCase("en-IN");
  if(names.has(key))throw new Error("Duplicate package name");
  names.add(key);
  return {...item,name,position:index,isPrimary:index===0,
   ...normalizedLegacyHrPackagePay(item)};
 });
}
