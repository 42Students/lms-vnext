import { z } from "zod";
import type { LearnerProfileDocument } from "./profile-validation";
import {learnerProfileCareerCoverage} from "./learner-profile-career-coverage-model";

/** The existing profile completion denominator, made explainable and actionable. */
export const learnerProfileSectionSchema = z.enum([
  "profile-introduction", "contacts", "social-profiles", "address",
  "personal-details", "identity", "experiences", "education", "skills",
  "projects", "certifications", "achievements", "languages",
  "extracurriculars", "hobbies", "metadata",
]);

export type LearnerProfileSection = z.infer<typeof learnerProfileSectionSchema>;

/** The exact 20 legacy ProfileSectionsPanel learner entries, in display order.
 * Section=null means the new identity/media/placement controller owns the
 * action; these are visible in profile navigation but never inflate the
 * 16-field completion denominator or masquerade as an editable profile field.
 */
export const LEARNER_LEGACY_PROFILE_ANATOMY: readonly {
 legacyKey:string; label:string; shape:"single"|"list";
 section:LearnerProfileSection|null;
 surface:"PROFILE"|"PLACEMENTS"|"PRIVATE_FILE"|"MEDIA";
}[] = [
 {legacyKey:"header",label:"Header",shape:"single",section:"profile-introduction",surface:"PROFILE"},
 {legacyKey:"about",label:"About",shape:"single",section:"profile-introduction",surface:"PROFILE"},
 {legacyKey:"personalDetails",label:"Personal Details",shape:"single",section:"personal-details",surface:"PROFILE"},
 {legacyKey:"identity",label:"Identity Documents",shape:"single",section:"identity",surface:"PROFILE"},
 {legacyKey:"languages",label:"Languages",shape:"list",section:"languages",surface:"PROFILE"},
 {legacyKey:"contact",label:"Contact",shape:"single",section:"contacts",surface:"PROFILE"},
 {legacyKey:"address",label:"Address",shape:"single",section:"address",surface:"PROFILE"},
 {legacyKey:"social",label:"Social Profiles",shape:"single",section:"social-profiles",surface:"PROFILE"},
 {legacyKey:"education",label:"Education",shape:"list",section:"education",surface:"PROFILE"},
 {legacyKey:"jobPreferences",label:"Job Preferences",shape:"single",section:null,surface:"PLACEMENTS"},
 {legacyKey:"resume",label:"Resume",shape:"single",section:null,surface:"PRIVATE_FILE"},
 {legacyKey:"certifications",label:"Certifications",shape:"list",section:"certifications",surface:"PROFILE"},
 {legacyKey:"achievements",label:"Achievements",shape:"list",section:"achievements",surface:"PROFILE"},
 {legacyKey:"skills",label:"Skills",shape:"list",section:"skills",surface:"PROFILE"},
 {legacyKey:"projects",label:"Projects",shape:"list",section:"projects",surface:"PROFILE"},
 {legacyKey:"experiences",label:"Experience / Internships",shape:"list",section:"experiences",surface:"PROFILE"},
 {legacyKey:"extracurricular",label:"Extra-curricular",shape:"list",section:"extracurriculars",surface:"PROFILE"},
 {legacyKey:"hobbies",label:"Hobbies & Interests",shape:"single",section:"hobbies",surface:"PROFILE"},
 {legacyKey:"videoIntro",label:"Video Intro",shape:"single",section:null,surface:"MEDIA"},
 {legacyKey:"metadata",label:"Metadata",shape:"single",section:"metadata",surface:"PROFILE"},
];

export function learnerProfileChecklist(document: LearnerProfileDocument) {
  const hasText = (value: unknown) =>
    typeof value === "string" && value.trim().length > 0;
  const items: { section: LearnerProfileSection; label: string; completed: boolean }[] = [
    {
      section: "profile-introduction", label: "Introduction",
      completed: hasText(document.headline) || hasText(document.bio),
    },
    { section: "contacts", label: "Contacts", completed: Object.values(document.contacts).some(hasText) },
    { section: "social-profiles", label: "Social profiles", completed: Object.values(document.socialProfiles).some(hasText) },
    { section: "address", label: "Address", completed: Object.values(document.address).some(hasText) },
    { section: "personal-details", label: "Personal details", completed: Object.values(document.personalDetails).some(hasText) },
    {
      section: "identity", label: "Identity details (optional)",
      completed: hasText(document.identity.aadhaarNumber) || hasText(document.identity.panNumber),
    },
    { section: "experiences", label: "Experience", completed: document.experiences.length > 0 },
    { section: "education", label: "Education", completed: document.education.length > 0 },
    { section: "skills", label: "Skills", completed: document.skills.length > 0 },
    { section: "projects", label: "Projects", completed: document.projects.length > 0 },
    { section: "certifications", label: "Certifications", completed: document.certifications.length > 0 },
    { section: "achievements", label: "Achievements", completed: document.achievements.length > 0 },
    { section: "languages", label: "Languages", completed: document.languages.length > 0 },
    { section: "extracurriculars", label: "Extracurricular activities", completed: document.extracurriculars.length > 0 },
    { section: "hobbies", label: "Hobbies", completed: document.hobbies.length > 0 },
    { section: "metadata", label: "Additional information", completed: document.metadata.length > 0 },
  ];
  const completed = items.filter(item => item.completed).length;
  // Use the same persisted, non-sensitive career weights as the on-page ring.
  const percentage=learnerProfileCareerCoverage({items}).percentage??0;
  return {items,completed,total:items.length,percentage};
}
