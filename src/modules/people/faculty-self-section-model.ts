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

/** Stable receipt references for the faculty section read view and the
 * administrator's separate, permission-checked attachment workflow. Clients
 * receive only a UUID; a feature route must still authorize an on-demand
 * download grant. Never render a raw bucket URL from these values.
 */
export type FacultyReceiptReference = {
  section:"identity"|"photo"|"education"|"certifications"|"experiences";
  entryId:string|null;
  field:string;
  documentId:string;
};
export function facultyProfileReceiptReferences(
  document:FacultyProfileDocument,
):FacultyReceiptReference[]{
  const receipts:FacultyReceiptReference[]=[];
  const add=(section:FacultyReceiptReference["section"],entryId:string|null,
    field:string,documentId:string|null)=>{
    if(documentId)receipts.push({section,entryId,field,documentId});
  };
  add("identity",null,"aadhaarDocumentId",document.identitySummary.aadhaarDocumentId);
  add("identity",null,"panDocumentId",document.identitySummary.panDocumentId);
  add("photo",null,"profileImageDocumentId",document.profileImageDocumentId);
  for(const entry of document.education)
    add("education",entry.id,"certificateDocumentId",entry.certificateDocumentId);
  for(const entry of document.certifications)
    add("certifications",entry.id,"certificateDocumentId",entry.certificateDocumentId);
  for(const entry of document.experiences){
    add("experiences",entry.id,"experienceCertificateDocumentId",
      entry.experienceCertificateDocumentId);
    add("experiences",entry.id,"offerLetterDocumentId",entry.offerLetterDocumentId);
  }
  return receipts;
}

/** A plan, NOT an authorization or mutation. The administrator service must:
 * (1) recheck the live actor's college-scoped profile/document permission,
 * (2) lock the target membership and version, and verify every added receipt
 * belongs to that same membership and has a clean READY storage attestation,
 * (3) persist the new document and audit event in one transaction, and
 * (4) enqueue a best-effort deletion for retired documents AFTER commit.
 * Before physical deletion it must recheck shared receipt references to avoid
 * deleting a document still attached elsewhere. Failed deletion is a visible
 * retryable recovery item; a successful JSON write is never proof of cleanup.
 */
export function planFacultyAdminReceiptChange(
  current:FacultyProfileDocument,
  rawNext:unknown,
):{
  next:FacultyProfileDocument;
  attachedReceiptIds:string[];
  detachedReceiptIds:string[];
  auditAction:"FACULTY_PROFILE_RECEIPT_CHANGED";
}{
  const next=facultyProfileDocumentSchema.parse(rawNext);
  const before=new Set(facultyProfileReceiptReferences(current).map(row=>row.documentId));
  const after=new Set(facultyProfileReceiptReferences(next).map(row=>row.documentId));
  return {
    next,
    attachedReceiptIds:[...after].filter(id=>!before.has(id)),
    detachedReceiptIds:[...before].filter(id=>!after.has(id)),
    auditAction:"FACULTY_PROFILE_RECEIPT_CHANGED",
  };
}

/** Legacy Add/Edit/Delete calls persisted one item immediately. vNext batches
 * edits in a draft: only an explicit Save persists them atomically via the
 * section version check. Keep this copy visible wherever repeatable sections
 * are edited so removing a row is not mistaken for a saved deletion.
 */
export const facultyRepeatableDraftSaveCopy = {
  save:"Save changes",
  pending:"Unsaved changes",
  saved:"Changes saved",
  conflict:"Index out of bounds. Please refresh and try again.",
} as const;

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
  // The visible link editor exposes the six public scalar URLs, while legacy
  // documents may also contain codingProfiles and codingProfileLinks. An edit
  // of LinkedIn must not silently erase those unseen persisted collections.
  const socialValue=patch.section==="socialProfiles"&&patch.value&&
    typeof patch.value==="object"&&!Array.isArray(patch.value)
    ? {...current.socialProfiles,...(patch.value as Record<string,unknown>)}
    : patch.value;
  // New public links must be secure. Unchanged historical HTTP links are
  // retained to avoid destroying unrelated legacy data during section updates.
  if(patch.section==="socialProfiles") {
    // The section contains nested codingProfiles and codingProfileLinks as well
    // as scalar URLs. Validating it as Record<string,string> rejected every
    // legitimate update that retained either nested field.
    const incoming=facultyProfileDocumentSchema.parse({
      ...current,socialProfiles:socialValue,
    }).socialProfiles;
    const previous=current.socialProfiles;
    const entries=(profile:typeof previous):Array<[string,string]>=>[
      ["linkedIn",profile.linkedIn],
      ["github",profile.github],
      ["portfolio",profile.portfolio],
      ["twitter",profile.twitter],
      ["googleScholar",profile.googleScholar],
      ["researchGate",profile.researchGate],
      ...Object.entries(profile.codingProfiles).map(([name,link])=>
        ["codingProfiles."+name,link] as [string,string]),
      ...profile.codingProfileLinks.map((link,index)=>
        ["codingProfileLinks."+index,link] as [string,string]),
    ];
    const previousLinks=new Map(entries(previous));
    for(const [key,raw] of entries(incoming)){
      // Preserve unchanged legacy HTTP links for edit parity. Every new or
      // changed link, including nested coding links, must be secure.
      if(!raw||raw===previousLinks.get(key))continue;
      let valid=false;
      try {
        const url=new URL(raw);
        valid=url.protocol==="https:"&&!!url.hostname&&!url.username&&!url.password&&
          url.hostname!=="localhost"&&!url.hostname.endsWith(".localhost");
      }catch{valid=false;}
      if(!valid)throw new Error("Faculty public profile links must use HTTPS");
    }
  }
  // Reparse the *whole* document; cross-entry chronology, URLs and IDs apply.
  const copy: Record<string,unknown> = {
    ...current,[patch.section]:patch.section==="socialProfiles"?socialValue:patch.value,
  };
  const next=facultyProfileDocumentSchema.parse(copy);
  if(patch.section==="skills" && (next.skills.some(row=>!row.skill.trim()) ||
    new Set(next.skills.map(row=>row.id)).size!==next.skills.length))
    throw new Error("Skills require unique record IDs and non-empty titles");
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
