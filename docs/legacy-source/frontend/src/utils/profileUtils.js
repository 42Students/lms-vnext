export function stringValueCheck(entity) {
  if (entity && entity !== "string" && entity !== " ") {
    return true;
  } else {
    return false;
  }
}

// Profile completeness sections with weights
export const LEARNER_SECTIONS = [
  { key: "personalDetails", label: "Personal Details", weight: 15, required: true },
  { key: "contact", label: "Contact Information", weight: 10, required: true },
  { key: "address", label: "Address", weight: 5, required: false },
  { key: "identity", label: "Identity Documents", weight: 5, required: false },
  { key: "qualifications", label: "Education", weight: 15, required: true },
  { key: "skills", label: "Skills", weight: 10, required: true },
  { key: "experiences", label: "Experience", weight: 10, required: false },
  { key: "projects", label: "Projects", weight: 10, required: false },
  { key: "certifications", label: "Certifications", weight: 5, required: false },
  { key: "achievements", label: "Achievements", weight: 5, required: false },
  { key: "languages", label: "Languages", weight: 3, required: false },
  { key: "extracurricular", label: "Extracurricular", weight: 3, required: false },
  { key: "hobbies", label: "Hobbies", weight: 2, required: false },
  { key: "social", label: "Social Profiles", weight: 2, required: false },
];

export const FACULTY_SECTIONS = [
  { key: "personalDetails", label: "Personal Details", weight: 15, required: true },
  { key: "contact", label: "Contact Information", weight: 10, required: true },
  { key: "address", label: "Address", weight: 5, required: false },
  { key: "identity", label: "Identity Documents", weight: 5, required: false },
  { key: "qualifications", label: "Education", weight: 15, required: true },
  { key: "skills", label: "Skills", weight: 10, required: true },
  { key: "experiences", label: "Experience", weight: 15, required: true },
  { key: "publications", label: "Publications", weight: 10, required: false },
  { key: "awards", label: "Awards", weight: 5, required: false },
  { key: "certifications", label: "Certifications", weight: 5, required: false },
  { key: "languages", label: "Languages", weight: 3, required: false },
  { key: "social", label: "Social Profiles", weight: 2, required: false },
];

const isEmptyValue = (v) => {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  return false;
};

export const hasData = (data) => {
  if (data === null || data === undefined) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") {
    const values = Object.values(data);
    return values.some(v => !isEmptyValue(v));
  }
  return Boolean(data);
};

export const calculateCompletion = (profileData, sections) => {
  const safeProfileData = profileData && typeof profileData === "object" ? profileData : {};
  const safeSections = Array.isArray(sections) ? sections : [];

  let totalWeight = 0;
  let completedWeight = 0;
  let completedCount = 0;

  safeSections.forEach(section => {
    totalWeight += section.weight;
    const sectionData = safeProfileData[section.key];
    const isComplete = hasData(sectionData);

    if (isComplete) {
      completedWeight += section.weight;
      completedCount++;
    }
  });

  const rawPercentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, Math.round(rawPercentage)));

  return {
    percentage,
    completedCount,
    totalSections: safeSections.length,
    incompleteCount: safeSections.length - completedCount,
  };
};

const COLORS = { primary: "#26bac7", success: "#059669", warning: "#d97706", error: "#ef4444" };

export const getStatusColor = (percentage) => {
  const p = Number(percentage);
  if (Number.isNaN(p) || p < 0) return COLORS.primary;
  if (p >= 80) return COLORS.success;
  if (p >= 50) return COLORS.warning;
  return COLORS.error;
};

export const getMessage = (percentage) => {
  const p = Number(percentage);
  if (Number.isNaN(p) || p < 0) return "Welcome! Let's build your profile together.";
  if (p === 100) return "Excellent! Your profile is complete!";
  if (p >= 80) return "Great job! Almost there!";
  if (p >= 60) return "Good progress! Keep going!";
  if (p >= 40) return "You are on your way! Add more details.";
  if (p >= 20) return "Good start! Complete your profile to stand out.";
  return "Welcome! Let's build your profile together.";
};

export const getProfileHoverMessage = (percentage) => {
  const p = Number(percentage);
  if (Number.isNaN(p) || p < 0) return { title: "Complete your profile", sub: "Add your details now to complete your profile" };
  if (p === 100) return { title: "Profile complete!", sub: "Your profile looks great" };
  if (p >= 80) return { title: "Almost there!", sub: "Add a few more details to complete your profile" };
  if (p >= 60) return { title: "Good progress!", sub: "Add remaining details to complete your profile" };
  if (p >= 40) return { title: "Halfway there!", sub: "Add more details to complete your profile" };
  if (p >= 20) return { title: "Complete your profile", sub: "Add your details to complete your profile" };
  return { title: "Complete your profile", sub: "Add your details now to complete your profile" };
};
