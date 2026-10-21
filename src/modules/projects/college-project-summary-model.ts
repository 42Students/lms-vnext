import { z } from "zod";
const nullable = (max: number) => z.string().trim().max(max).nullable();
const dateOrNull = z.iso.date().nullable();
export const collegeProjectSummaryFieldsSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
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
  sprintLengthWeeks: z.number().int().min(1).max(104).nullable(),
  estimationUnit: z.enum(["POINTS","HOURS","TASKS"]).nullable(),
});
export const collegeProjectSummaryPatch = collegeProjectSummaryFieldsSchema.extend({
  expectedTitle: z.string(),
  expectedSummary: z.string().nullable(),
  expectedStatus: z.enum(["PLANNED","ACTIVE","COMPLETED"]),
  expectedUpdatedAt: z.iso.datetime({offset:true}),
}).superRefine((value,ctx) => {
  if(value.startDate && value.endDate && value.endDate < value.startDate)
    ctx.addIssue({code:"custom",path:["endDate"],message:"End date must be on or after start date."});
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


/** Old scalar workspace edit sent only touched fields and classId=0
 * explicitly detached the class. This schema keeps optimistic tokens
 * required and does not assume omitted inputs should be cleared. */
export const collegeProjectSummarySparsePatch = collegeProjectSummaryFieldsSchema
 .partial().extend({
  sectionId:z.union([z.string().uuid(),z.literal(0),z.null()]).optional(),
  expectedTitle:z.string(),
  expectedSummary:z.string().nullable(),
  expectedStatus:z.enum(["PLANNED","ACTIVE","COMPLETED"]),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
 }).strict();
export function materializeCollegeProjectSummaryPatch(
 current:Record<(typeof collegeProjectSummaryFields)[number],unknown>,
 raw:unknown,
){
 const input=collegeProjectSummarySparsePatch.parse(raw);
 const desired={...current,...input,
  ...(input.sectionId===0?{sectionId:null}:{})};
 return collegeProjectSummaryPatch.parse(desired);
}

/** Historical legacy statuses were broader than vNext lifecycle. Preserve
 * their semantic label as phase/blocker/read-only facts on migration instead
 * of writing an unsupported status or letting ARCHIVED become editable. */
export function legacyWorkspaceStatusMigration(status:string){
 switch(status){
  case "PLANNED":return {status:"PLANNED" as const,legacyDetail:null};
  case "ACTIVE":return {status:"ACTIVE" as const,legacyDetail:null};
  case "IN_PROGRESS":return {status:"ACTIVE" as const,legacyDetail:"IN_PROGRESS"};
  case "READY":return {status:"ACTIVE" as const,legacyDetail:"READY"};
  case "BLOCKED":return {status:"ACTIVE" as const,legacyDetail:"BLOCKED"};
  case "COMPLETED":return {status:"COMPLETED" as const,legacyDetail:null};
  case "ARCHIVED":return {status:"ARCHIVED" as const,legacyDetail:null,readOnly:true as const};
  default:return null;
 }
}
