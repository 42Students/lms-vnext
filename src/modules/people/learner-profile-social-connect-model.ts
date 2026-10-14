import type {LearnerProfileSection} from "./learner-profile-checklist";
/** Only the known social section may request focus inside the existing editor. */
export function learnerProfileSocialFocusField(section:LearnerProfileSection|null|undefined){
 return section==="social-profiles"?"linkedinUrl" as const:null;
}
