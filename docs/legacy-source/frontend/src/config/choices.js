// The fixed dropdown values, used until GET /api/v1/choices answers (see hooks/useChoices). Keep in step with ChoicesController.
export const FALLBACK_CHOICES = {
  genders: ["Male", "Female", "Other", "Prefer not to say"].map((v) => ({ value: v, label: v })),
  jobTypes: ["Full-time", "Internship", "Internship + full-time", "Contract", "Apprenticeship"].map((v) => ({ value: v, label: v, builtin: true, countsAsPlaced: v !== "Internship" })),
  driveModes: [{ value: "ON_CAMPUS", label: "On campus" }, { value: "POOL", label: "Pool" }, { value: "OFF_CAMPUS", label: "Off campus" }],
  registrationChoices: [{ value: "PLACEMENTS", label: "Placements" }, { value: "HIGHER_STUDIES", label: "Higher studies" }, { value: "NOT_INTERESTED", label: "Not interested" }],
  educationTypes: [],
  gradingTypes: ["CGPA", "Percentage", "Grade", "GPA"].map((v) => ({ value: v, label: v })),
  codingPlatforms: [
    { value: "LEETCODE", key: "LEETCODE", label: "LeetCode", urlPrefix: "https://leetcode.com/u/", pattern: "[A-Za-z0-9_-]{3,30}", hint: "3-30 letters, digits, _ or -" },
    { value: "HACKERRANK", key: "HACKERRANK", label: "HackerRank", urlPrefix: "https://www.hackerrank.com/profile/", pattern: "[A-Za-z0-9_.-]{3,30}", hint: "3-30 letters, digits, _ . or -" },
    { value: "CODECHEF", key: "CODECHEF", label: "CodeChef", urlPrefix: "https://www.codechef.com/users/", pattern: "[A-Za-z][A-Za-z0-9_]{2,19}", hint: "starts with a letter, 3-20 letters, digits or _" },
    { value: "CODEFORCES", key: "CODEFORCES", label: "Codeforces", urlPrefix: "https://codeforces.com/profile/", pattern: "[A-Za-z0-9_.-]{3,24}", hint: "3-24 letters, digits, _ . or -" },
    { value: "GFG", key: "GFG", label: "GeeksforGeeks", urlPrefix: "https://www.geeksforgeeks.org/user/", pattern: "[A-Za-z0-9_.-]{3,40}", hint: "3-40 letters, digits, _ . or -" },
    { value: "HACKEREARTH", key: "HACKEREARTH", label: "HackerEarth", urlPrefix: "https://www.hackerearth.com/@", pattern: "[A-Za-z0-9_.-]{3,40}", hint: "3-40 letters, digits, _ . or -" },
  ],
  branches: [],
  passingYears: [],
  outcomes: [],
  outcomeLabels: [],
  // Where a recruiter lead came from: the ones a person picks, then the two the system sets. Keep in step with TpoRecruiterLeadService.SOURCES.
  recruiterLeadSources: [
    ["ALUMNI", "Alumni"], ["REFERRAL", "Referral"], ["LINKEDIN", "LinkedIn"], ["JOB_PORTAL", "Job portal"], ["EVENT", "Event or job fair"],
    ["COLD_OUTREACH", "Cold outreach"], ["COMPANY_REACHED_OUT", "Company reached out"],
  ].map(([value, label]) => ({ value, label, pickable: true })).concat([{ value: "MANUAL", label: "Added by hand", pickable: false }, { value: "IMPORT", label: "Imported", pickable: false }]),
};

/** A recruiter lead's source in words; a recruiter lead from before sources existed (none recorded) was added by hand. */
export const recruiterLeadSourceLabel = (sources, code) => (sources || FALLBACK_CHOICES.recruiterLeadSources).find((s) => s.value === (code || "MANUAL"))?.label || code;

/** The final placement outcomes (fixed; NAAC 5.2 / NIRF). Keep in step with PlacementOutcomeService.OUTCOMES. */
export const OUTCOMES = [
  { value: "PLACED_ON_CAMPUS", label: "Placed (on campus)" },
  { value: "PLACED_OFF_CAMPUS", label: "Placed (off campus)" },
  { value: "HIGHER_STUDIES", label: "Higher studies" },
  { value: "ENTREPRENEURSHIP", label: "Entrepreneurship / self-employed" },
  { value: "COMPETITIVE_EXAMS", label: "Competitive exams" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "SEEKING", label: "Looking for a job" },
  { value: "DEBARRED", label: "Debarred" },
  { value: "NOT_REGISTERED", label: "Not decided yet" },
];
/** The outcomes that are a registration choice: the placement cell sets them, and a college label sits under one of them. */
export const SETTABLE_OUTCOMES = ["HIGHER_STUDIES", "ENTREPRENEURSHIP", "COMPETITIVE_EXAMS", "NOT_INTERESTED"];
/** What each outcome's detail field asks for, when it has one. */
export const OUTCOME_DETAIL_HINT = { HIGHER_STUDIES: "University and course", ENTREPRENEURSHIP: "The business", COMPETITIVE_EXAMS: "The exam, e.g. GATE 2027", NOT_INTERESTED: "Reason (optional)" };
