import type {FacultySelfSection} from "./faculty-self-section-model";
/** Links to actual existing Faculty self-profile forms; no external data is exposed. */
/** Order and displayed section names match the legacy ProfileSectionsPanel.
 * Header and identity are read-only; all scoped document edits remain gated. */
export const FACULTY_PROFILE_NAV=[
 {section:"about",label:"About"},
 {section:"personalDetails",label:"Personal Details"},
 {section:"languages",label:"Languages"},
 {section:"contact",label:"Contact"},
 {section:"address",label:"Address"},
 {section:"socialProfiles",label:"Social Profiles"},
 {section:"education",label:"Education"},
 {section:"certifications",label:"Certifications"},
 {section:"experiences",label:"Work Experience"},
 {section:"skills",label:"Skills"},
 {section:"publications",label:"Publications & Research"},
 {section:"awards",label:"Awards & Recognitions"},
 {section:"metadata",label:"Metadata"},
] as const;
export const FACULTY_PROFILE_LEGACY_NAV=[
 {key:"header",label:"Header",href:"#faculty-header",editable:false},
 {key:"about",label:"About",href:"#faculty-about",editable:true},
 {key:"personalDetails",label:"Personal Details",href:"#faculty-personalDetails",editable:true},
 {key:"identity",label:"Identity Documents",href:"#faculty-identity-readonly",editable:false},
 {key:"languages",label:"Languages",href:"#faculty-languages",editable:true},
 {key:"contact",label:"Contact",href:"#faculty-contact",editable:true},
 {key:"address",label:"Address",href:"#faculty-address",editable:true},
 {key:"socialProfiles",label:"Social Profiles",href:"#faculty-socialProfiles",editable:true},
 {key:"education",label:"Education",href:"#faculty-education",editable:true},
 {key:"certifications",label:"Certifications",href:"#faculty-certifications",editable:true},
 {key:"experiences",label:"Work Experience",href:"#faculty-experiences",editable:true},
 {key:"skills",label:"Skills",href:"#faculty-skills",editable:true},
 {key:"publications",label:"Publications & Research",href:"#faculty-publications",editable:true},
 {key:"awards",label:"Awards & Recognitions",href:"#faculty-awards",editable:true},
 {key:"metadata",label:"Metadata",href:"#faculty-metadata",editable:true},
] as const;
export function facultyProfileAnchor(section:FacultySelfSection):string{
 return "faculty-"+section;
}
