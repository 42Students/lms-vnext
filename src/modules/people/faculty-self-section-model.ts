import { z } from "zod";
import { facultyProfileDocumentSchema, type FacultyProfileDocument } from "./faculty-profile-document";

/** Writable, non-identity sections. Private contact and document receipts stay blocked. */
export const facultySelfEditableSection = z.enum([
  "about", "personalDetails", "address", "socialProfiles",
  "languages", "education", "certifications", "experiences",
  "skills", "publications", "awards", "metadata",
]);
export const facultySelfSectionPatchSchema = z.object({
  section: facultySelfEditableSection,
  value: z.unknown(),
  expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
}).strict();
export type FacultySelfSection = z.infer<typeof facultySelfEditableSection>;
export function updateFacultyProfileSection(
  current: FacultyProfileDocument, raw: unknown,
): FacultyProfileDocument {
  const patch=facultySelfSectionPatchSchema.parse(raw);
  // Reparse the *whole* document; cross-entry chronology, URLs and IDs apply.
  const copy: Record<string,unknown> = {...current, [patch.section]:patch.value};
  return facultyProfileDocumentSchema.parse(copy);
}
