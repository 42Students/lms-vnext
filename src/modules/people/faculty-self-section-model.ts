import { z } from "zod";
import { facultyProfileDocumentSchema, type FacultyProfileDocument } from "./faculty-profile-document";
import { facultyMetadataEditableKey } from "./faculty-profile-metadata-model";

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
  // Prevent forged PATCH requests from smuggling identity credentials into metadata.
  // Preexisting protected keys are retained unchanged, never newly editable.
  if (patch.section === "metadata") {
    const incoming = z.record(z.string(),z.union([
      z.string(),z.number(),z.boolean(),z.null(),
    ])).parse(patch.value);
    for (const [key,value] of Object.entries(incoming)) {
      if (!facultyMetadataEditableKey(key) && current.metadata[key] !== value) {
        throw new Error("Identity and secret metadata cannot be edited");
      }
    }
  }
  // Reparse the *whole* document; cross-entry chronology, URLs and IDs apply.
  const copy: Record<string,unknown> = {...current, [patch.section]:patch.value};
  return facultyProfileDocumentSchema.parse(copy);
}
