import {learnerProfileSectionSchema,type LearnerProfileSection} from "./learner-profile-checklist";
const legacySections:Record<string,LearnerProfileSection>={
 "connect-accounts":"social-profiles",
 "social":"social-profiles",
 "contact":"contacts",
 "contact-details":"contacts",
 "qualification":"education",
 "qualifications":"education",
 "personal":"personal-details",
 "extra-curricular":"extracurriculars",
};
/** Normalize older self-service profile links without broadening learner access. */
export function learnerProfileResolveSection(raw:unknown):LearnerProfileSection|null{
 if(typeof raw!=="string")return null;
 const canonical=legacySections[raw.trim()]??raw.trim();
 const parsed=learnerProfileSectionSchema.safeParse(canonical);
 return parsed.success?parsed.data:null;
}
export function learnerProfileSectionRecoveryNotice(raw:unknown):string|null{
 if(raw===undefined)return null;
 return learnerProfileResolveSection(raw)!==null ? null :
  "That profile section link is not available. Showing your profile overview instead.";
}
