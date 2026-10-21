import { z } from "zod";

/** First-step draft fields only. Deadline is ISO with explicit zone offset. */
export const tpoDraftDriveStepOneSchema = z.object({
  confirmed: z.literal(true),
  companyRelationshipId: z.string().uuid(),
  seasonId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(20000),
  employmentType: z.enum(["FULL_TIME", "INTERNSHIP", "CONTRACT"]),
  /** Canonical scoped label (all five built-ins and active custom types). */
  jobTypeLabel: z.string().trim().min(2).max(40)
   .regex(/^[\p{L}\p{N} +&/().,'-]+$/u,"Choose an available job type").optional(),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
  applicationDeadline: z.iso.datetime({ offset: true }).nullable(),
}).strict().superRefine((value, ctx) => {
  if (value.applicationDeadline &&
      Date.parse(value.applicationDeadline) <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["applicationDeadline"],
      message: "Application deadline must be a future, offset-qualified instant",
    });
  }
});

export function normalizedTpoDraftDeadline(value: string | null): Date | null {
  if (value === null) return null;
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error("Invalid deadline");
  return instant;
}

/** Build the college's picker without exposing hidden choices on new drives.
 * A previously saved hidden label remains selectable on that historical drive,
 * but must not be offered when creating a new one. The service re-verifies it.
 */
export function tpoDraftAvailableJobTypeLabels(
 rows: readonly {label:string;active:boolean}[],historicalLabel?:string|null,
):string[]{
 const normalized=new Set<string>(),result:string[]=[];
 for(const item of rows){
  const name=item.label.trim(),key=name.toLocaleLowerCase("en");
  if((item.active||key===historicalLabel?.trim().toLocaleLowerCase("en"))&&!normalized.has(key)){
   normalized.add(key);result.push(name);
  }
 }
 return result;
}
