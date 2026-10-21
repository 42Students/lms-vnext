import { z } from "zod";
import {
  BUG_AFFECTED_LAYERS,
  BUG_REGRESSION_TEST_STATUSES,
  BUG_RESOLUTIONS,
  BUG_RETEST_RESULTS,
  BUG_STATUSES,
} from "./workflow";

export const BUG_ACCOUNT_ROLES = [
  "LEARNER","FACULTY","MENTOR","COLLEGE_ADMIN","SUPER_ADMIN","NOT_SURE",
] as const;
export const BUG_SEVERITIES = [
  "BLOCKER", "CRITICAL", "MAJOR", "MINOR", "UI_ONLY", "SUGGESTION", "NOT_SURE",
] as const;
export const BUG_ENVIRONMENTS = [
  "LOCAL", "DEVELOPMENT", "UAT", "PRODUCTION", "OTHER", "NOT_SURE",
] as const;

/** Empty filter fields in legacy URL/search forms mean "All". Explicit
 * invalid values still fail instead of broadening a tenant-scoped query. */
const blankAsAbsent=<T extends z.ZodType>(schema:T)=>z.preprocess(
 value=>value===""?undefined:value,schema.optional(),
);
export const BUG_TRACKER_STATUS_OPTIONS=BUG_STATUSES.map(value=>({
 value,label:value.toLowerCase().split("_").map(part=>
   part.charAt(0).toUpperCase()+part.slice(1)).join(" "),
}));
export const trackerAdminListSchema = z.object({
  status: blankAsAbsent(z.enum(BUG_STATUSES,{error:"Choose a valid issue status"})),
  severity: blankAsAbsent(z.enum(BUG_SEVERITIES)),
  accountRole: blankAsAbsent(z.enum(BUG_ACCOUNT_ROLES)),
  resolution: blankAsAbsent(z.enum(["UNRESOLVED",...BUG_RESOLUTIONS] as const,{error:"Choose a valid resolution"})),
  retestStatus: blankAsAbsent(z.enum(["NOT_RETESTED","PASS","FAIL"])),
  productionVerified: z.boolean().optional(),
  environment: blankAsAbsent(z.enum(BUG_ENVIRONMENTS)),
  q: blankAsAbsent(z.string().trim().min(1).max(200)),
  reporter: blankAsAbsent(z.string().trim().min(1).max(100)),
  issueType: blankAsAbsent(z.string().trim().min(1).max(80)),
  createdFrom: z.date().optional(),
  createdBefore: z.date().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  beforeCreatedAt: z.iso.datetime({ offset: true }).transform((x) => new Date(x)).optional(),
  beforeId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict().superRefine((value, ctx) => {
  if(value.createdFrom && value.createdBefore && value.createdFrom >= value.createdBefore){
    ctx.addIssue({code:"custom",path:["createdBefore"],message:"Invalid IST date interval"});
  }
  if (Boolean(value.beforeCreatedAt) !== Boolean(value.beforeId)) {
    ctx.addIssue({
      code: "custom",
      path: ["beforeId"],
      message: "Tracker cursor requires both beforeCreatedAt and beforeId",
    });
  }
});

export const trackerPublicIdSchema = z.string().trim().regex(/^LMS-[0-9]{4,}$/i);

export const trackerWorkflowUpdateSchema = z.object({
  expectedVersion: z.number().int().min(0),
  status: z.enum(BUG_STATUSES,{error:"Choose a valid issue status"}).nullable().optional(),
  resolution: z.enum(BUG_RESOLUTIONS,{error:"Choose a valid resolution"}).or(z.literal("")).nullable().optional(),
  affectedLayer: z.enum(BUG_AFFECTED_LAYERS).nullable().optional(),
  rootCause: z.string().max(4000).nullable().optional(),
  fixNotes: z.string().max(4000).nullable().optional(),
  frontendCommitSha: z.string().max(64).nullable().optional(),
  backendCommitSha: z.string().max(64).nullable().optional(),
  regressionTestStatus: z.enum(BUG_REGRESSION_TEST_STATUSES).nullable().optional(),
  productionVerified: z.boolean().nullable().optional(),
}).strict();

export const trackerRetestSchema = z.object({
  expectedVersion: z.number().int().min(0),
  result: z.enum(BUG_RETEST_RESULTS),
  note: z.string().trim().max(1000).nullable().optional(),
}).strict();

/** Persisted workflow writes require a current CAS revision. The legacy
 * integer issue identifier is a presentation alias, never a mutation key. */
export const LEGACY_TRACKER_ADMIN_CROSSWALK={
 issueId:"UUID report identity via verified public ID",
 publicId:"case-folded LMS-#### display key",
 status:"status",severity:"severity",resolution:"resolution",
 retestResult:"retestStatus",optimisticVersion:"expectedVersion",
} as const;
