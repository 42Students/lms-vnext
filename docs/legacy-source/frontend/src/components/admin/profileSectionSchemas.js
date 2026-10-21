// Field definitions for ProfileSectionsPanel.js, one entry per profile section key. Replaces the
// raw-JSON textarea editor with labeled inputs matching the actual backend DTO shape (see
// dto/profile/*.java) -- a college admin correcting a faculty/student profile shouldn't need to
// know JSON to do it.
//
// type: "text" | "textarea" | "boolean" | "stringList" (comma-separated <-> string[])
// A section with no entry here (or a field type not listed) falls back to the JSON editor --
// this only covers flat, DTO-backed fields; genuinely dynamic/nested data (metadata, examDetails,
// education-config-driven fields) is intentionally left as JSON, the escape hatch it was built as.

const F = (name, label, type = "text") => ({ name, label, type });

export const SECTION_FIELD_SCHEMAS = {
  header: [
    F("firstName", "First Name"),
    F("lastName", "Last Name"),
    F("rollNumber", "Roll Number"),
    F("uniqueId", "Employee/Unique ID"),
    F("department", "Department"),
    F("facultyType", "Faculty Type"),
    F("profileImage", "Profile Image URL"),
  ],
  about: [
    F("description", "About", "textarea"),
  ],
  personalDetails: [
    F("gender", "Gender"),
    F("dob", "Date of Birth (YYYY-MM-DD)"),
    F("bloodGroup", "Blood Group"),
  ],
  identity: [
    F("aadhaarNumber", "Aadhaar Number"),
    F("aadhaarUpload", "Aadhaar Upload URL"),
    F("panNumber", "PAN Number"),
    F("panUpload", "PAN Upload URL"),
  ],
  languages: [
    F("language", "Language"),
    F("proficiency", "Proficiency"),
  ],
  contact: [
    F("contactMobile", "Mobile Number"),
    F("contactPhone", "Alternate Phone"),
    F("contactMail", "Email"),
  ],
  address: [
    F("currentAddress", "Current Address", "textarea"),
    F("currentCity", "Current City"),
    F("currentState", "Current State"),
    F("currentPincode", "Current Pincode"),
    F("permanentAddress", "Permanent Address", "textarea"),
    F("permanentCity", "Permanent City"),
    F("permanentState", "Permanent State"),
    F("permanentPincode", "Permanent Pincode"),
    F("city", "City (legacy, shared)"),
    F("state", "State (legacy, shared)"),
    F("pincode", "Pincode (legacy, shared)"),
  ],
  social: [
    F("linkedIn", "LinkedIn"),
    F("github", "GitHub"),
    F("portfolio", "Portfolio"),
    F("twitter", "Twitter"),
    F("googleScholar", "Google Scholar"),
    F("researchGate", "ResearchGate"),
  ],
  education: [
    F("educationType", "Education Type"),
    F("program", "Program"),
    F("specialization", "Specialization"),
    F("institutionName", "Institution Name"),
    F("startYear", "Start Year"),
    F("endYear", "End Year"),
    F("isCurrentlyPursuing", "Currently Pursuing", "boolean"),
    F("gradingType", "Grading Type"),
    F("grade", "Grade"),
    F("maxGrade", "Max Grade"),
    F("qualifyingExam", "Qualifying Exam"),
    F("description", "Description", "textarea"),
    F("certificateUpload", "Certificate Upload URL"),
    F("degree", "Degree (legacy)"),
    F("field", "Field (legacy)"),
    F("score", "Score (legacy)"),
  ],
  jobPreferences: [
    F("rolePreference", "Role Preference"),
    F("specificRolePreference", "Specific Role Preference"),
    F("workShiftPreference", "Work Shift Preference"),
    F("preferredEmploymentCity", "Preferred Employment City"),
    F("examSlotPreference", "Exam Slot Preference"),
    F("jobNotificationsEnabled", "Job Notifications Enabled", "boolean"),
  ],
  resume: [
    F("resumeUrl", "Resume URL"),
  ],
  certifications: [
    F("name", "Certification Name"),
    F("authority", "Issuing Authority"),
    F("certificationDate", "Certification Date (YYYY-MM-DD)"),
    F("validityDate", "Validity Date (YYYY-MM-DD)"),
    F("certificateLink", "Certificate Link"),
    F("certificateUpload", "Certificate Upload URL"),
    F("description", "Description", "textarea"),
  ],
  achievements: [
    F("title", "Title"),
    F("year", "Year"),
    F("description", "Description", "textarea"),
  ],
  skills: [
    F("skill", "Skill"),
    F("proficiency", "Proficiency"),
  ],
  projects: [
    F("name", "Project Name"),
    F("description", "Description", "textarea"),
    F("githubUrl", "GitHub URL"),
    F("liveUrl", "Live URL"),
    F("skillsUsed", "Skills Used (comma-separated)", "stringList"),
    F("startDate", "Start Date (YYYY-MM-DD)"),
    F("endDate", "End Date (YYYY-MM-DD)"),
  ],
  experiences: [
    F("organization", "Organization"),
    F("designation", "Designation"),
    F("experienceType", "Experience Type"),
    F("location", "Location"),
    F("from", "From (YYYY-MM-DD)"),
    F("to", "To (YYYY-MM-DD)"),
    F("isPaid", "Paid", "boolean"),
    F("salary", "Salary / Compensation"),
    F("description", "Description", "textarea"),
    F("internshipCertificateUpload", "Internship Certificate Upload URL"),
    F("offerLetterUpload", "Offer Letter Upload URL"),
  ],
  extracurricular: [
    F("activity", "Activity"),
    F("year", "Year"),
    F("description", "Description", "textarea"),
  ],
  hobbies: [
    F("hobby", "Hobby"),
  ],
  videoIntro: [
    F("videoIntroUrl", "Video Intro URL"),
    F("hasVideoIntro", "Has Video Intro", "boolean"),
  ],
  publications: [
    F("title", "Title"),
    F("journal", "Journal"),
    F("year", "Year"),
    F("doi", "DOI"),
    F("link", "Link"),
    F("authors", "Authors"),
    F("description", "Description", "textarea"),
  ],
  awards: [
    F("title", "Title"),
    F("awardedBy", "Awarded By"),
    F("year", "Year"),
    F("description", "Description", "textarea"),
  ],
  // metadata intentionally has no schema -- it's a free-form Map<String,Object> escape hatch,
  // not a fixed set of fields, so a JSON editor is the right tool for it, not a mistake.
};
