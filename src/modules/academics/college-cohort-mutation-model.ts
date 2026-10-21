import { z } from "zod";

const name = z.string().trim().min(1, "Enter a batch name").max(255, "Maximum 255 characters");
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid batch code");
const uuid = z.string().uuid();
/** Legacy has a canonical seven-character YYYY-YY consecutive-year value.
 * Imported historical multi-year cohorts must not be silently rewritten. */
const legacyYear = z.string().trim()
  .length(7, "Use consecutive years, e.g., 2026-27")
  .regex(/^\d{4}-\d{2}$/, "Use consecutive years, e.g., 2026-27")
  .refine(value => {
    const start = Number(value.slice(0, 4));
    const finish = Number(value.slice(5, 7));
    return finish === (start + 1) % 100;
  }, "Use consecutive years, e.g., 2026-27");
const legacyDate=z.iso.date();
/** Legacy batch form page-size preference. This function is only called
 * client-side by the screen; server queries keep their deterministic 25 rows.
 * Storage corruption is ignored rather than expanding a DB list unexpectedly.
 */
export const legacyBatchPageSizeKey="admin-batches-page-size";
export const batchPageSizeChoices=[10,25,50,100] as const;
export function readLegacyBatchPageSize(storage?:Pick<Storage,"getItem">|null){
  let raw:string|null=null;
  try{raw=storage?.getItem(legacyBatchPageSizeKey)??null;}catch{return 25;}
  const value=Number(raw);
  return batchPageSizeChoices.some(choice=>choice===value)?value:25;
}

export function parseBatchAcademicYear(value:unknown):string|null {
  const result=legacyYear.safeParse(value);
  return result.success?result.data:null;
}
/** The old start-month control is intentionally independent of the cohort
 * calendar period selected in the role/college-scoped vNext form. */
export function batchAcademicYearWithStartMonth(startDate:string,startMonth:number):string{
  if(!Number.isInteger(startMonth)||startMonth<1||startMonth>12)
    throw new Error("Start month must be between 1 and 12");
  const date=legacyDate.parse(startDate);
  const year=Number(date.slice(0,4));
  const month=Number(date.slice(5,7));
  const start=month>=startMonth?year:year-1;
  return `${start}-${String((start+1)%100).padStart(2,"0")}`;
}


export const createCollegeCohortSchema = z.object({
  programId: uuid,
  name,
  code,
  startPeriodId: uuid,
  expectedEndPeriodId: uuid.nullable(),
  academicYear:legacyYear.nullable().optional(),
  startDate:legacyDate.nullable().optional(),
  endDate:legacyDate.nullable().optional(),
}).strict().superRefine((v,ctx)=>{
  if(v.startDate&&v.endDate&&v.endDate<v.startDate)ctx.addIssue({code:"custom",path:["endDate"],message:"End date cannot be before start date"});
});

export const updateCollegeCohortSchema = z.object({
  name,
  code,
  expectedEndPeriodId: uuid.nullable(),
  academicYear:legacyYear.nullable().optional(),
  startDate:legacyDate.nullable().optional(),
  endDate:legacyDate.nullable().optional(),
  confirm: z.literal(true),
}).strict().superRefine((v,ctx)=>{
  if(v.startDate&&v.endDate&&v.endDate<v.startDate)ctx.addIssue({code:"custom",path:["endDate"],message:"End date cannot be before start date"});
});

export const collegeCohortIdSchema = uuid;

export function hasUnsavedCollegeCohortEdit(
  saved: { name: string; code: string; expectedEndPeriodId: string | null; academicYear?: string | null; startDate?: string|null; endDate?:string|null },
  draft: { name: string; code: string; expectedEndPeriodId: string | null; academicYear?: string | null; startDate?:string|null; endDate?:string|null },
) {
  return saved.name !== draft.name ||
    saved.code !== draft.code ||
    saved.expectedEndPeriodId !== draft.expectedEndPeriodId ||
    saved.academicYear!==draft.academicYear || saved.startDate!==draft.startDate || saved.endDate!==draft.endDate;
}

export function validCohortPeriodRange(
  startDate: string,
  endDate: string | null,
): boolean {
  return endDate === null || endDate >= startDate;
}

/** Legacy default academic year begins in July. The cohort end-date may be
 * years later and must not be the end of the one-year academic-year label.
 * UI may still supply an explicitly configured canonical academic year. */
export function batchAcademicYearFromDates(startDate:string,_endDate:string|null):string {
 return batchAcademicYearWithStartMonth(startDate,7);
}
