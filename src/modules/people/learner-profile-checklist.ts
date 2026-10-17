import { z } from "zod";
import type { LearnerProfileDocument } from "./profile-validation";

/** The existing profile completion denominator, made explainable and actionable. */
export const learnerProfileSectionSchema = z.enum([
  "profile-introduction", "contacts", "social-profiles", "address",
  "personal-details", "identity", "experiences", "education", "skills",
  "projects", "certifications", "achievements", "languages",
  "extracurriculars", "hobbies", "metadata",
]);

export type LearnerProfileSection = z.infer<typeof learnerProfileSectionSchema>;

/** Legacy completion weights: key identity/career evidence counts more than
 * optional metadata. Keep section counts for the checklist UI, but never
 * mistake an equally weighted section count for profile completeness. */
export const LEARNER_PROFILE_SECTION_WEIGHTS:ReadOnlyWeights={
 "profile-introduction":5,"contacts":10,"social-profiles":4,
 "address":4,"personal-details":15,"identity":2,
 "experiences":10,"education":15,"skills":10,"projects":10,
 "certifications":3,"achievements":3,"languages":2,
 "extracurriculars":2,"hobbies":2,"metadata":3,
};
type ReadOnlyWeights=Readonly<Record<LearnerProfileSection,number>>;

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
  const totalWeight=items.reduce((sum,item)=>sum+LEARNER_PROFILE_SECTION_WEIGHTS[item.section],0);
  const earned=items.reduce((sum,item)=>sum+(item.completed?LEARNER_PROFILE_SECTION_WEIGHTS[item.section]:0),0);
  return { items, completed, total: items.length, percentage: totalWeight ? Math.round(100 * earned / totalWeight) : 0 };
}
