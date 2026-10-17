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
