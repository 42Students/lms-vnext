import { z } from "zod";
import { facultyContactEditSchema, facultyProfileDocumentSchema, type FacultyProfileDocument } from "./faculty-profile-document";
import { facultyMetadataEditableKey } from "./faculty-profile-metadata-model";

/** All document receipts remain administrator-controlled until uploads are approved.
 * New entries may only have null receipts; existing receipts cannot be replaced or
 * orphaned by deleting their parent entry.
 */
export function facultyReceiptIdsUnchanged<T extends {id:string}>(
 current:readonly T[], next:readonly T[], names:readonly (keyof T & string)[],
):boolean {
 const previous=new Map(current.map(row=>[row.id,row]));
 for(const original of current){
  if(names.some(name=>original[name]!=null) && !next.some(row=>row.id===original.id))return false;
 }
 for(const row of next){
  const old=previous.get(row.id);
  for(const name of names){
   if((old?.[name]??null)!==(row[name]??null))return false;
  }
 }
 return true;
}

/** The contact section is editable as self-reported data; it never changes
 * the verified login email/phone. Identity receipt replacement requires a
 * separate, membership-scoped upload workflow, not a section PATCH.
 */
export const facultySelfProtectedSections = ["identitySummary", "profileImageDocumentId"] as const;
export type FacultySelfProtectedSection = typeof facultySelfProtectedSections[number];

/** Safe card metadata for the legacy Identity Documents position. Do not send
 * storage keys or signed URLs to the public profile. */
export function facultyIdentityEvidenceStatus(document: FacultyProfileDocument) {
  return {
    aadhaarMasked: document.identitySummary.aadhaarLast4
      ? "•••• " + document.identitySummary.aadhaarLast4 : "Not provided",
    aadhaarEvidence: document.identitySummary.aadhaarDocumentId ? "On file" : "Not uploaded",
    panEvidence: document.identitySummary.panDocumentId ? "On file" : "Not uploaded",
    profilePhoto: document.profileImageDocumentId ? "On file" : "Not uploaded",
    replacementAllowedInSectionPatch: false as const,
  };
}

/** Writable, non-identity sections. Private contact and document receipts stay blocked. */
export const facultySelfEditableSection = z.enum([
  "about", "personalDetails", "contact", "address", "socialProfiles",
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
  // Contact is self-reported, not the verified sign-in identity.
  if (patch.section === "contact") facultyContactEditSchema.parse(patch.value);
  // New public links must be secure. Unchanged historical HTTP links are
  // retained to avoid destroying unrelated legacy data during section updates.
  if(patch.section==="socialProfiles") {
    const links=z.record(z.string(),z.string()).parse(patch.value);
    for(const [key,raw] of Object.entries(links)){
      if(raw && raw!==current.socialProfiles[key as keyof typeof current.socialProfiles]){
        let valid=false;
        try{
          const url=new URL(raw);
          valid=url.protocol==="https:" && !!url.hostname && !url.username && !url.password &&
            url.hostname!=="localhost" && !url.hostname.endsWith(".localhost");
        }catch{valid=false;}
        if(!valid)throw new Error("Faculty public profile links must use HTTPS");
      }
    }
  }
  // Reparse the *whole* document; cross-entry chronology, URLs and IDs apply.
  const copy: Record<string,unknown> = {...current, [patch.section]:patch.value};
  const next=facultyProfileDocumentSchema.parse(copy);
  if(patch.section==="education" && !facultyReceiptIdsUnchanged(
    current.education,next.education,["certificateDocumentId"],
  ))throw new Error("Private education document receipts cannot be changed");
  if(patch.section==="certifications" && !facultyReceiptIdsUnchanged(
    current.certifications,next.certifications,["certificateDocumentId"],
  ))throw new Error("Private certification document receipts cannot be changed");
  if(patch.section==="experiences" && !facultyReceiptIdsUnchanged(
    current.experiences,next.experiences,["experienceCertificateDocumentId","offerLetterDocumentId"],
  ))throw new Error("Private experience document receipts cannot be changed");
  return next;
}

/** Self-profile writes may not replace or orphan private receipts. Only
 * a separately authorized, membership-bound upload grants new receipts.
 */
export function facultyPrivateReceiptsUnchanged(
  current: FacultyProfileDocument, next: FacultyProfileDocument,
): boolean {
  if (current.profileImageDocumentId !== next.profileImageDocumentId) return false;
  if (current.identitySummary.aadhaarDocumentId !== next.identitySummary.aadhaarDocumentId ||
      current.identitySummary.panDocumentId !== next.identitySummary.panDocumentId ||
      current.identitySummary.aadhaarLast4 !== next.identitySummary.aadhaarLast4 ||
      current.identitySummary.panMasked !== next.identitySummary.panMasked) return false;
  return facultyReceiptIdsUnchanged(current.education, next.education, ["certificateDocumentId"]) &&
    facultyReceiptIdsUnchanged(current.certifications, next.certifications, ["certificateDocumentId"]) &&
    facultyReceiptIdsUnchanged(current.experiences, next.experiences, ["experienceCertificateDocumentId", "offerLetterDocumentId"]);
}
