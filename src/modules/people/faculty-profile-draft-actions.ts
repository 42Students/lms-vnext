import {facultyMetadataEditableKey,type FacultyMetadataDraftEntry} from "./faculty-profile-metadata-model";
import type {FacultyProfileDocument} from "./faculty-profile-document";
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
