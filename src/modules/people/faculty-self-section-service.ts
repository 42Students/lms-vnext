import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { facultySelfSectionPatchSchema,updateFacultyProfileSection } from "./faculty-self-section-model";
import { loadOwnFacultyProfileDocumentStaged,saveOwnFacultyProfileDocumentStaged } from "./faculty-profile-self.staged";

/** Legacy stale row index and the vNext version token both mean the form
 * was edited against an outdated list. The client must retain entered fields,
 * show this recovery copy, and allow an explicit refresh before retry. */
export const facultySelfSectionStaleRecoveryMessage =
 "Index out of bounds. Please refresh and try again.";

/** Reusing the persisted-actor lock and optimistic CAS in the staged adapter. */
export async function patchOwnFacultyProfileSection(context:RequestContext,raw:unknown){
 const input=facultySelfSectionPatchSchema.parse(raw);
 const current=await loadOwnFacultyProfileDocumentStaged(context);
 // A concurrent update between this read and the write is rejected in the SQL CAS.
 if(current.version!==input.expectedVersion){
  const {PeopleServiceError}=await import("./errors");
  throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
 }
 const updated=updateFacultyProfileSection(current.document,input);
 return saveOwnFacultyProfileDocumentStaged(context,updated,input.expectedVersion);
}
