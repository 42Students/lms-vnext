import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { facultySelfSectionPatchSchema,updateFacultyProfileSection } from "./faculty-self-section-model";
import { loadOwnFacultyProfileDocumentStaged,saveOwnFacultyProfileDocumentStaged } from "./faculty-profile-self.staged";

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
