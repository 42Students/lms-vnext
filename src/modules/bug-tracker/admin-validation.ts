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

export const trackerAdminListSchema = z.object({
  status: z.enum(BUG_STATUSES,{error:"Choose a valid issue status"}).optional(),
  severity: z.enum(BUG_SEVERITIES).optional(),
  accountRole: z.enum(BUG_ACCOUNT_ROLES).optional(),
  resolution: z.enum(["UNRESOLVED",...BUG_RESOLUTIONS] as const,{error:"Choose a valid resolution"}).optional(),
  retestStatus: z.enum(["NOT_RETESTED","PASS","FAIL"]).optional(),
  productionVerified: z.boolean().optional(),
  environment: z.enum(BUG_ENVIRONMENTS).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  reporter: z.string().trim().min(1).max(100).optional(),
  issueType: z.string().trim().min(1).max(80).optional(),
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
