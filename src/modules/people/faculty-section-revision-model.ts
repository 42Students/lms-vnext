import type { FacultySelfSection } from "./faculty-self-section-model";

/** Updating one section must not reset pending unsaved drafts in other forms. */
export function advanceFacultySectionRevision(
 current:Partial<Record<FacultySelfSection,number>>,
 section:FacultySelfSection,
):Partial<Record<FacultySelfSection,number>> {
 return {...current,[section]:(current[section]??0)+1};
}
