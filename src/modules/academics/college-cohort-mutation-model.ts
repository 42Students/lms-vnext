import { z } from "zod";

const name = z.string().trim().min(1, "Batch name is required").max(255);
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid batch code");
const uuid = z.string().uuid();
const legacyYear=z.string().trim().min(4).max(16).regex(/^\\d{4}([\\s–-]+\\d{2,4})?$/, "Enter a valid academic year");
const legacyDate=z.iso.date();

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
  if(v.startDate&&v.endDate&&v.endDate<v.startDate)ctx.addIssue({code:"custom",path:["endDate"],message:"End date cannot be before start date."});
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
  if(v.startDate&&v.endDate&&v.endDate<v.startDate)ctx.addIssue({code:"custom",path:["endDate"],message:"End date cannot be before start date."});
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

/** Legacy academic-year badge (e.g. 2023-27) from the persisted date span.
 * Uses fallback start-year + one year if no end period is supplied. */
export function batchAcademicYearFromDates(startDate:string,endDate:string|null):string {
 const start=Number(startDate.slice(0,4));
 const end=endDate?Number(endDate.slice(0,4)):start+1;
 return `${start}-${String(end).slice(-2)}`;
}
