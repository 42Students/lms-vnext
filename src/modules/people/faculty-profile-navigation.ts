import type {FacultySelfSection} from "./faculty-self-section-model";
/** Links to actual existing Faculty self-profile forms; no external data is exposed. */
export const FACULTY_PROFILE_NAV=[
 {section:"about",label:"About"},
 {section:"personalDetails",label:"Personal details"},
 {section:"address",label:"Address"},
 {section:"socialProfiles",label:"Social profiles"},
 {section:"skills",label:"Skills"},
 {section:"metadata",label:"Metadata"},
 {section:"awards",label:"Awards"},
 {section:"publications",label:"Publications"},
 {section:"experiences",label:"Experience"},
 {section:"certifications",label:"Certifications"},
 {section:"education",label:"Education"},
 {section:"languages",label:"Languages"},
] as const;
export function facultyProfileAnchor(section:FacultySelfSection):string{
 return "faculty-"+section;
}
