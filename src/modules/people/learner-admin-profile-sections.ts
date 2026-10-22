import type {LearnerProfileDocument} from "./profile-validation";
import {LEARNER_LEGACY_PROFILE_ANATOMY} from "./learner-profile-checklist";

export type LearnerAdminProfileSection={
 key:string; label:string; items:string[]; notice:string|null;
};

/** Sanitized read-only equivalents of all 20 legacy learner sections.
 * Identity numbers, upload receipts and arbitrary metadata values must never
 * cross the scoped administrative roster response boundary. */
export function projectLearnerAdminProfileSections(
 document:LearnerProfileDocument,
):LearnerAdminProfileSection[]{
 const parts=(values:readonly (string|undefined)[]) =>
  values.filter((value):value is string=>typeof value==="string"&&value.trim().length>0);
 const labeled=(key:string,value:string)=>value.trim()?key+": "+value.trim():"";
 const entries:Record<string,string[]>={
  header:parts([document.headline]),
  about:parts([document.bio]),
  personalDetails:parts([
   labeled("Gender",document.personalDetails.gender),
   labeled("Date of birth",document.personalDetails.dateOfBirth),
   labeled("Blood group",document.personalDetails.bloodGroup),
  ]),
  identity:[],
  languages:document.languages.map(row=>row.language+" · "+row.proficiency),
  contact:parts([
   labeled("Contact email",document.contacts.contactEmail),
   labeled("Alternate phone",document.contacts.alternatePhone),
  ]),
  address:parts([
   document.address.currentAddress,
   [document.address.city,document.address.state,document.address.pincode].filter(Boolean).join(", "),
   document.address.permanentAddress,
   [document.address.permanentCity,document.address.permanentState,
    document.address.permanentPincode].filter(Boolean).join(", "),
  ]),
  social:Object.entries(document.socialProfiles).flatMap(([key,value])=>
   value.trim()?[labeled(key,value)]:[]),
  education:document.education.map(row=>[
   row.program||row.educationType,row.institution,row.endYear,row.gradeObtained,
  ].filter(Boolean).join(" · ")),
  jobPreferences:parts([
   labeled("Preferred roles",document.jobPreferences.rolePreferences.join(", ")),
   labeled("Specific role",document.jobPreferences.specificRolePreference),
   labeled("Work shift",document.jobPreferences.workShiftPreference),
   labeled("Preferred city",document.jobPreferences.preferredEmploymentCity),
  ]),
  resume:[],
  certifications:document.certifications.map(row=>row.name),
  achievements:document.achievements.map(row=>row.title),
  skills:document.skills.map(row=>row.name),
  projects:document.projects.map(row=>row.name),
  experiences:document.experiences.map(row=>[
   row.designation,row.organization,row.experienceType,
  ].filter(Boolean).join(" · ")),
  extracurricular:document.extracurriculars.map(row=>row.activity),
  hobbies:[...document.hobbies],
  videoIntro:[],
  metadata:[],
 };
 const notices:Record<string,string>={
  identity:"Identity numbers and supporting documents remain private in this overview.",
  resume:"Private resume files are not exposed in this roster. Open the authorized document workflow.",
  videoIntro:"Private video and upload receipts are not exposed in this roster.",
  metadata:"Additional private metadata values are not included in administrative summaries.",
 };
 return LEARNER_LEGACY_PROFILE_ANATOMY.map(section=>({
  key:section.legacyKey,label:section.label,
  items:entries[section.legacyKey]??[],notice:notices[section.legacyKey]??null,
 }));
}

