import { z } from "zod";

const semesterName = z.string().trim()
  .min(1, "Please enter semester name")
  .max(255, "Name must be 255 characters or less");
const credits = z.number().int().min(0).max(1000).nullable();

export const createCollegeSemesterSchema = z.object({
  programId: z.string().uuid("Please select program"),
  termNumber: z.number({ error: "Enter semester number" }).int("Enter a whole semester number")
    .min(1, "Semester number must be 1 or more")
    .max(12, "Semester number must be between 1 and 12"),
  name: semesterName,
  totalCredits: credits.optional(),
  isActive: z.boolean().optional(),
}).strict();

/** Full and partial legacy editors both supply a CAS token and an explicit
 * confirmation. Omitted fields retain persisted values inside the lock; an
 * intentional null totalCredits removes the optional credit target. */
export const updateCollegeSemesterSchema = z.object({
  name: semesterName.optional(),
  totalCredits: credits.optional(),
  isActive: z.boolean().optional(),
  expectedUpdatedAt: z.iso.datetime({offset:true}),
  confirm: z.literal(true),
}).strict().refine(input=>
  input.name!==undefined || input.totalCredits!==undefined ||
  input.isActive!==undefined,
  {message:"Select at least one semester field to update"},
);

/** Legacy NewProgramStructureDTO allows null status/dates. Translate those
 * at a trusted source adapter only; untrusted numeric program IDs never flow
 * into UUID first-party CRUD routes. */
export const legacySemesterEditFieldsSchema=z.object({
  name:semesterName.optional(),
  totalCredits:credits.optional(),
  active:z.boolean().optional(),
  isActive:z.boolean().optional(),
}).strict();
export function legacySemesterEditFields(input:unknown){
  const parsed=legacySemesterEditFieldsSchema.parse(input);
  return {name:parsed.name,totalCredits:parsed.totalCredits,
    isActive:parsed.isActive??parsed.active};
}

export const deleteCollegeSemesterSchema = z.object({
  confirm: z.literal(true),
}).strict();

export const semesterIdSchema = z.string().uuid();

export function canCreateSemesterTerm(termNumber: number, durationTerms: number) {
  return Number.isInteger(termNumber) && termNumber >= 1 &&
    termNumber <= Math.min(durationTerms,12);
}

export type CreateCollegeSemesterInput = z.infer<typeof createCollegeSemesterSchema>;
export type UpdateCollegeSemesterInput = z.infer<typeof updateCollegeSemesterSchema>;

/**
 * Validation-only bridge for a legacy NewProgramStructureDTO. The numeric
 * programId/courseIds cannot be passed into UUID-first vNext mutations: a
 * trusted college-scoped import must resolve their identities separately.
 * Dates were unrestricted legacy strings (max 255), not necessarily ISO dates.
 */
export const legacyProgramStructureSourceSchema = z.object({
  programId: z.number().int().positive("A valid program, structure and status are required"),
  name: z.string().trim().min(1, "Please enter semester name")
    .max(255, "Name must be 255 characters or less"),
  startDate: z.string().max(255, "Start date must be 255 characters or less").nullish(),
  endDate: z.string().max(255, "End date must be 255 characters or less").nullish(),
  courseIds: z.array(z.number().int().positive()).nullish(),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"],
    { error: "Status must be ACTIVE, INACTIVE or COMPLETED" }).nullish(),
});

/** Preserve terminal historical state independently of isActive. */
export function legacyStructureStatusFields(status: "ACTIVE" | "INACTIVE" | "COMPLETED") {
  return { isActive: status === "ACTIVE", legacyStructureStatus: status } as const;
}

/** A legacy completed row cannot be reactivated via the boolean-only editor. */
export function canEditHistoricalSemesterStatus(
  storedStatus: "ACTIVE" | "INACTIVE" | "COMPLETED" | null,
  nextIsActive: boolean,
) {
  return storedStatus !== "COMPLETED" || !nextIsActive;
}
