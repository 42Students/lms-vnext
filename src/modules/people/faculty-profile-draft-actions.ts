import {facultyMetadataEditableKey,facultyMetadataFromDraft,type FacultyMetadataDraftEntry} from "./faculty-profile-metadata-model";
import {facultyProfileDocumentSchema,type FacultyProfileDocument} from "./faculty-profile-document";
import type {FacultySelfSection} from "./faculty-self-section-model";
/** Restore exactly the persisted text draft after an explicit discard. */
export function restoreFacultyTextDraft(snapshot:Readonly<Record<string,string>>):Record<string,string>{
 return {...snapshot};
}

/** Restore skill drafts with fresh object identities after explicit consent. */
export function restoreFacultySkills<T extends {id:string}>(saved:readonly T[]):T[]{
 return saved.map(row=>({...row}));
}

/** Rebuild only editable textual metadata while retaining protected typed values at save. */
export function restoreFacultyMetadataDraft(
 saved:FacultyProfileDocument["metadata"],newId:()=>string,
):FacultyMetadataDraftEntry[]{
 return Object.entries(saved)
  .filter((entry):entry is [string,string]=>typeof entry[1]==="string" && facultyMetadataEditableKey(entry[0]))
  .map(([key,value])=>({id:newId(),key,value}));
}

/** Skill removal always identifies one draft record and never changes its snapshot. */
export function removeFacultySkillDraft<T extends {id:string}>(saved:readonly T[],id:string):T[]{
 if(!saved.some(row=>row.id===id))return [...saved];
 return saved.filter(row=>row.id!==id);
}

/** Inline feedback uses the same metadata writer contract, not a parallel heuristic. */
export function facultyMetadataDraftIssue(
 saved:FacultyProfileDocument["metadata"],draft:readonly FacultyMetadataDraftEntry[],
):string|null{
 try{
  facultyMetadataFromDraft(saved,draft);
  return null;
 }catch(error){
  if(error instanceof Error&&error.message==="Duplicate or protected metadata key")
   return "Duplicate or protected metadata key";
  return "Use unique, permitted field names and text within their limits.";
 }
}

/** Validate Faculty-owned text sections against the same Zod document accepted by PATCH. */
export function facultyProfileTextDraftIssue(
 section:FacultySelfSection,draft:Readonly<Record<string,string>>,
):string|null{
 if(!["about","personalDetails","address","socialProfiles"].includes(section))
  return "This profile section cannot be edited as text.";
 const parsed=facultyProfileDocumentSchema.safeParse({[section]:draft});
 return parsed.success?null:(parsed.error.issues[0]?.message??"Review this section.");
}
