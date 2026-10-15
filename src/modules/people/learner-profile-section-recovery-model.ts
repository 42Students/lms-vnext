import {learnerProfileSectionSchema} from "./learner-profile-checklist";
/** Duplicate/invalid Profile section query is rejected without exposing raw values. */
export function learnerProfileSectionRecoveryNotice(raw:unknown):string|null{
 if(raw===undefined)return null;
 return learnerProfileSectionSchema.safeParse(raw).success ? null :
  "That profile section link is not available. Showing your profile overview instead.";
}
