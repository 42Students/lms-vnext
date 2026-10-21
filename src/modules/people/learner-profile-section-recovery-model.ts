import {learnerProfileSectionSchema,LEARNER_LEGACY_PROFILE_ANATOMY,type LearnerProfileSection} from "./learner-profile-checklist";
const legacySections:Record<string,LearnerProfileSection>={
 "connect-accounts":"social-profiles",
 "social":"social-profiles",
 "contact":"contacts",
 "contact-details":"contacts",
 "qualification":"education",
 "qualifications":"education",
 "personal":"personal-details",
 "extra-curricular":"extracurriculars",
 "qualification-details":"education",
 "personalDetails":"personal-details",
};
/** Normalize older self-service profile links without broadening learner access. */
export function learnerProfileResolveSection(raw:unknown):LearnerProfileSection|null{
 if(typeof raw!=="string")return null;
 const key=raw.trim();
 const linked=LEARNER_LEGACY_PROFILE_ANATOMY.find(item=>item.legacyKey===key);
 const canonical=linked?.section??legacySections[key]??key;
 const parsed=learnerProfileSectionSchema.safeParse(canonical);
 return parsed.success?parsed.data:null;
}
export function learnerProfileSectionRecoveryNotice(raw:unknown):string|null{
 if(raw===undefined)return null;
 return learnerProfileResolveSection(raw)!==null ? null :
  "That profile section link is not available. Showing your profile overview instead.";
}

/** Preserve old profile section links as deep links into the scoped workspace.
 * Identity/file/placement sections intentionally have no mutable profile
 * section target; their read-only/status affordances remain on the overview.
 */
export function learnerLegacyProfileSectionLink(legacyKey:string):string {
 const item=LEARNER_LEGACY_PROFILE_ANATOMY.find(row=>row.legacyKey===legacyKey);
 const resolved=item?.section??learnerProfileResolveSection(legacyKey);
 return resolved?"/learn/profile?section="+encodeURIComponent(resolved):"/learn/profile";
}
