// Marketing site content — sourced from "42 LMS Website.docx".
// Centralized so Home and the sub-pages stay in sync.

export const BRAND = {
  name: "42 LMS",
  tagline: "The AI Talent & Workforce Operating System",
  demoEmail: "hello@42lms.com",
};

// mailto used by every "Request a Demo" CTA (placeholder until a real endpoint exists).
export const DEMO_MAILTO =
  "mailto:hello@42lms.com" +
  "?subject=" +
  encodeURIComponent("Request a Demo — 42 LMS") +
  "&body=" +
  encodeURIComponent(
    "Hi 42 LMS team,\n\nI'd like to see a demo.\n\nName:\nOrganization:\nRole:\nPhone:\nWhat you're looking to solve:\n\nThanks!"
  );

export const NAV = [
  { label: "Platform", href: "/platform" },
  { label: "For Universities", href: "/universities" },
  { label: "For Enterprises", href: "/enterprises" },
  { label: "Request a Demo", href: "/request-demo" },
];

export const AGENTS = [
  {
    icon: "tutor",
    name: "AI Tutor Agent",
    desc: "Personalized teaching, explanations, practice exercises, and learning support — available 24/7.",
  },
  {
    icon: "assessment",
    name: "AI Assessment Agent",
    desc: "Evaluates exams, assignments, projects, coding exercises, interviews, practical work, and handwritten submissions — with instant feedback and gap analysis.",
  },
  {
    icon: "coach",
    name: "AI Coach Agent",
    desc: "Guides each individual toward specific goals, certifications, roles, and performance outcomes.",
  },
  {
    icon: "career",
    name: "AI Career Agent",
    desc: "Recommends skills, projects, certifications, internships, jobs, and career pathways based on aspirations and live market demand.",
  },
  {
    icon: "knowledge",
    name: "AI Knowledge Agent",
    desc: "Transforms organizational and institutional knowledge into an always-available expert that answers questions instantly.",
  },
  {
    icon: "workforce",
    name: "AI Workforce Intelligence Agent",
    desc: "Analyzes workforce capabilities, collaboration, project execution, and business outcomes to surface capability gaps and future talent needs.",
  },
  {
    icon: "mentor",
    name: "AI Talent Development Agent",
    desc: "An AI mentor for every individual — continuously assessing, diagnosing weaknesses, building development plans, and measuring progress.",
  },
];

export const INTEGRATIONS = [
  "Assessments",
  "Assignments",
  "Projects",
  "Interviews",
  "Handwritten Exams",
  "GitHub",
  "Slack & Teams",
  "CRM & ERP Systems",
  "Knowledge Repositories",
  "Performance Data",
];

export const PILLARS = [
  {
    icon: "assessment",
    title: "AI Assessments",
    desc: "Evaluate knowledge, skills, projects, interviews, practical work, and handwritten submissions.",
  },
  {
    icon: "skills",
    title: "Skills Intelligence",
    desc: "Map capabilities, identify gaps, benchmark talent, and predict future requirements.",
  },
  {
    icon: "tutor",
    title: "Personalized Learning",
    desc: "Generate adaptive learning journeys tailored to every individual.",
  },
  {
    icon: "knowledge",
    title: "Knowledge Intelligence",
    desc: "Turn institutional and organizational knowledge into actionable intelligence.",
  },
  {
    icon: "mentor",
    title: "AI Agents",
    desc: "Continuous tutoring, coaching, mentoring, assessment, guidance, and workforce intelligence.",
  },
  {
    icon: "analytics",
    title: "Analytics & Insights",
    desc: "Measure readiness, progress, performance, employability, productivity, and outcomes.",
  },
];

export const LIFECYCLE = ["Assess", "Diagnose", "Learn", "Coach", "Improve", "Repeat"];

export const UNIVERSITIES = {
  eyebrow: "For Universities",
  title: "Develop Employable Graduates",
  points: [
    "Evaluate student performance across exams, assignments, projects, practical assessments, interviews, and handwritten submissions.",
    "Identify learning gaps early.",
    "Deliver personalized support.",
    "Improve career readiness.",
  ],
  outcomes: [
    "Better Student Outcomes",
    "Higher Employability",
    "Placement Readiness",
    "Continuous Assessment",
    "Personalized Learning",
  ],
};

export const ENTERPRISES = {
  eyebrow: "For Enterprises",
  title: "Build High-Performing Workforces",
  points: [
    "Connect work systems such as GitHub, Slack, Teams, CRM, ERP, HRMS, and knowledge platforms.",
    "Understand workforce capabilities in real time.",
    "Automatically identify capability gaps.",
    "Continuously improve productivity and organizational performance.",
  ],
  outcomes: [
    "Higher Productivity",
    "Faster Onboarding",
    "Better Knowledge Retention",
    "Stronger Workforce Capabilities",
    "Improved Business Performance",
  ],
};
