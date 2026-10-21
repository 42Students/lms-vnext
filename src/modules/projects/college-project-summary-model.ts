import { z } from "zod";
const nullable = (max: number) => z.string().trim().max(max).nullable();
const dateOrNull = z.iso.date().nullable();
export const collegeProjectSummaryPatch = z.strictObject({
  title: z.string().trim().min(1, "Title is required").max(160, "Title must be 160 characters or fewer"),
  summary: nullable(4000),
  status: z.enum(["PLANNED","ACTIVE","COMPLETED"]),
  progressPercent: z.number().int().min(0).max(100),
  phase: nullable(120),
  dueLabel: nullable(160),
  courseLabel: nullable(160),
  sectionId: z.string().uuid().nullable(),
  blocker: nullable(4000),
  nextAction: nullable(4000),
  startDate: dateOrNull,
  endDate: dateOrNull,
  sprintLengthWeeks: z.number().int().min(1).max(12).nullable(),
  estimationUnit: z.enum(["POINTS","HOURS","TASKS"]).nullable(),
  expectedTitle: z.string(),
  expectedSummary: z.string().nullable(),
  expectedStatus: z.enum(["PLANNED","ACTIVE","COMPLETED"]),
  expectedUpdatedAt: z.iso.datetime({offset:true}),
}).superRefine((value,ctx) => {
  if(value.startDate && value.endDate && value.endDate < value.startDate)
    ctx.addIssue({code:"custom",path:["endDate"],message:"End date must be on or after the start date"});
});
export function collegeProjectStatusChangeAllowed(from:string,to:string,hasMentor:boolean,approvedDelivery:boolean) {
  // Fail closed for ARCHIVED and unknown historical states, including no-op retries.
  const valid=["PLANNED","ACTIVE","COMPLETED"];
  if(!valid.includes(from)||!valid.includes(to))return false;
  if(from===to)return true;
  if(from==="PLANNED"&&to==="ACTIVE")return hasMentor;
  if(from==="ACTIVE"&&to==="COMPLETED")return approvedDelivery;
  return false;
}


/** A retry that already achieved the exact requested state must not emit
 * another activity event or notification. Compare persisted state rather than
 * trusting the caller's stale expectedUpdatedAt token. */
const collegeProjectSummaryFields = [
  "title", "summary", "status", "progressPercent", "phase", "dueLabel",
  "courseLabel", "sectionId", "blocker", "nextAction", "startDate",
  "endDate", "sprintLengthWeeks", "estimationUnit",
] as const;

type SummaryState = Record<(typeof collegeProjectSummaryFields)[number], unknown>;

export function collegeProjectSummaryMatchesCurrent(
  current: SummaryState,
  desired: SummaryState,
): boolean {
  return collegeProjectSummaryFields.every(field => current[field] === desired[field]);
}
