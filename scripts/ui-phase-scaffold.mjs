#!/usr/bin/env node
// Scaffold UI phase: add UI-01..UI-10 tasks to tracker.json with exact-clone parity standard.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const TODAY = "2026-11-02";

const FROZEN_LEGACY_FRONTEND_SHA = "83347e29b1f5c66d497dc5d99060e098338b382f";
const LEGACY_FRONTEND_PATH = "../42LMS/lms-dev-2026-frontend";

const UI_TASKS = [
  {
    id: "UI-01",
    title: "Auth, admin shell and tenant setup — exact clone parity",
    legacyPages: ["pages/index (login)", "pages/otp", "pages/forgot-password", "superadmin/* (113 pages)", "shared auth flows"],
    vNextDirs: ["src/app/(auth)", "src/app/(authenticated)/(superadmin)", "src/app/(authenticated)/admin"],
    dependsOn: ["API-01"],
    estimatedSurfaces: 60,
    roles: ["PUBLIC", "SUPERADMIN"],
    legacyAuditDocs: ["DESIGN-SYSTEM-BLUEPRINT.md"],
  },
  {
    id: "UI-02",
    title: "Academics — batches, programs, schedule — exact clone parity",
    legacyPages: ["superadmin/batches", "superadmin/programs", "superadmin/semester", "superadmin/schedule", "superadmin/groups", "superadmin/electives", "superadmin/departments", "college-admin/batches (59 pages overlap)"],
    vNextDirs: ["src/app/(authenticated)/(admin)/academics", "src/app/(authenticated)/(admin)/college"],
    dependsOn: ["UI-01", "API-02"],
    estimatedSurfaces: 80,
    roles: ["ADMIN", "LEARNER"],
    legacyAuditDocs: [],
  },
  {
    id: "UI-03",
    title: "Learner and faculty profiles — exact clone parity",
    legacyPages: ["learn/profile", "learn/documents", "superadmin/people", "faculty/profile"],
    vNextDirs: ["src/app/(authenticated)/(learner)/profile", "src/app/(authenticated)/people"],
    dependsOn: ["UI-01", "API-03"],
    estimatedSurfaces: 50,
    roles: ["LEARNER", "FACULTY", "ADMIN"],
    legacyAuditDocs: ["LEARNER_MODULE_AUDIT_REPORT.md"],
  },
  {
    id: "UI-04",
    title: "Courses and learning content — exact clone parity",
    legacyPages: ["superadmin/courses", "learn/courses", "faculty courses"],
    vNextDirs: ["src/app/(authenticated)/(admin)/courses", "src/app/(authenticated)/(learner)/learn"],
    dependsOn: ["UI-02", "API-04"],
    estimatedSurfaces: 70,
    roles: ["ADMIN", "FACULTY", "LEARNER"],
    legacyAuditDocs: ["COURSE_UI_AUDIT_FINDINGS.md"],
  },
  {
    id: "UI-05",
    title: "Assignments, quizzes, grading and attendance — exact clone parity",
    legacyPages: ["superadmin/assignments", "superadmin/quiz", "superadmin/attendance", "learn/assignments", "learn/attendance"],
    vNextDirs: ["src/app/(authenticated)/(admin)/attendance", "src/app/(authenticated)/(learner)"],
    dependsOn: ["UI-02", "API-05"],
    estimatedSurfaces: 60,
    roles: ["ADMIN", "FACULTY", "LEARNER"],
    legacyAuditDocs: [],
  },
  {
    id: "UI-06",
    title: "Projects and mentorship — exact clone parity",
    legacyPages: ["superadmin/projects", "learn/projects", "mentor pages"],
    vNextDirs: ["src/app/(authenticated)/(admin)/projects", "src/app/(authenticated)/(learner)/projects"],
    dependsOn: ["UI-02", "API-06"],
    estimatedSurfaces: 40,
    roles: ["ADMIN", "FACULTY", "LEARNER"],
    legacyAuditDocs: [],
  },
  {
    id: "UI-07",
    title: "Placements — learner and admin — exact clone parity",
    legacyPages: ["learn/placements", "superadmin/placements", "placement drive flows"],
    vNextDirs: ["src/app/(authenticated)/(learner)/placements", "src/app/(authenticated)/(admin)/placements"],
    dependsOn: ["UI-03", "API-07"],
    estimatedSurfaces: 70,
    roles: ["LEARNER", "ADMIN", "TPO"],
    legacyAuditDocs: ["MY-PLACEMENTS-CSS-AUDIT.md"],
  },
  {
    id: "UI-08",
    title: "TPO and recruiter CRM — exact clone parity",
    legacyPages: ["tpo/home", "tpo/drives", "tpo/students", "tpo/leads", "tpo/settings", "hr/home", "hr/profile"],
    vNextDirs: ["src/app/(authenticated)/(tpo)", "src/app/(authenticated)/(hr)"],
    dependsOn: ["UI-07", "API-08"],
    estimatedSurfaces: 50,
    roles: ["TPO", "HR"],
    legacyAuditDocs: [],
  },
  {
    id: "UI-09",
    title: "Notifications, announcements and operations — exact clone parity",
    legacyPages: ["tpo/notifications", "notification drawer (all roles)", "announcements", "discussions"],
    vNextDirs: ["src/app/(authenticated)/notifications"],
    dependsOn: ["UI-01", "API-09"],
    estimatedSurfaces: 30,
    roles: ["ALL"],
    legacyAuditDocs: ["NOTIFICATION_DRAWER_AUDIT.md"],
  },
  {
    id: "UI-10",
    title: "Global visual regression and clone certification gate",
    legacyPages: ["ALL — cross-cutting regression"],
    vNextDirs: ["src/app (all)"],
    dependsOn: ["UI-01","UI-02","UI-03","UI-04","UI-05","UI-06","UI-07","UI-08","UI-09"],
    estimatedSurfaces: 0,
    roles: ["ALL"],
    legacyAuditDocs: [],
  },
];

// Remove existing UI tasks if --force
const existing = tracker.tasks.filter(t => t.id?.startsWith("UI-"));
if (existing.length > 0 && !process.argv.includes("--force")) {
  console.log("UI tasks already exist. Use --force to overwrite.");
  process.exit(0);
}
if (existing.length > 0) tracker.tasks = tracker.tasks.filter(t => !t.id?.startsWith("UI-"));

for (const def of UI_TASKS) {
  const task = {
    id: def.id,
    title: def.title,
    phase: "UI",
    done: false,
    dependsOn: def.dependsOn,
    acceptedAt: null,
    acceptanceEvidence: [],
    workPlan: {
      schemaVersion: 1,
      scope: `${def.id}: ${def.title}`,
      frozenLegacyFrontendSha: FROZEN_LEGACY_FRONTEND_SHA,
      legacyFrontendPath: LEGACY_FRONTEND_PATH,
      masterPlan: "docs/planning/ui-phase-master-plan.md",
      legacyPages: def.legacyPages,
      vNextDirs: def.vNextDirs,
      roles: def.roles,
      estimatedSurfaces: def.estimatedSurfaces,
      legacyAuditDocs: def.legacyAuditDocs,
      packages: [
        {
          id: `${def.id}-P01`,
          kind: "SURFACE_INVENTORY",
          title: "Surface inventory — every page, modal, form, drawer catalogued",
          done: false,
          acceptedAt: null,
          acceptanceEvidence: [],
          inventoryFile: `docs/planning/ui-inventory-${def.id.toLowerCase().replace("-","")}.json`,
          acceptance: "Every legacy page/modal/form/drawer/empty-state/error-state for this domain catalogued with role, surface type, legacy path, vNext path, disposition (MATCHED/MISSING/REDESIGNED). Zero surfaces undocumented.",
        },
        {
          id: `${def.id}-P02`,
          kind: "STRING_CATALOGUE",
          title: "String catalogue — every UI string extracted from legacy",
          done: false,
          acceptedAt: null,
          acceptanceEvidence: [],
          catalogueFile: `docs/planning/ui-strings-${def.id.toLowerCase().replace("-","")}.json`,
          acceptance: "Every button label, modal title, form field label, placeholder, validation message, success toast, error toast, empty state text extracted from legacy source verbatim. Zero strings invented.",
        },
        {
          id: `${def.id}-P03`,
          kind: "SOURCE_PARITY_TEST",
          title: "Source parity test — all surfaces exist on disk, strings match",
          done: false,
          acceptedAt: null,
          acceptanceEvidence: [],
          testFile: `tests/ui${def.id.replace("UI-","").padStart(2,"0")}-source-parity.test.mjs`,
          ciWorkflow: `.github/workflows/ui${def.id.replace("UI-","").padStart(2,"0")}-p03-source-parity.yml`,
          acceptance: "Every MATCHED surface has vNextPath on disk (fs.existsSync). Every string in catalogue has usage in vNext component. Role gates enforced. No MISSING surfaces tolerated — must be built first.",
        },
        {
          id: `${def.id}-P04`,
          kind: "VISUAL_PARITY_TEST",
          title: "Playwright visual parity — pixel diff < 0.5% vs legacy screenshots",
          done: false,
          acceptedAt: null,
          acceptanceEvidence: [],
          testFile: `tests/ui${def.id.replace("UI-","").padStart(2,"0")}-visual-parity.spec.ts`,
          ciWorkflow: `.github/workflows/ui${def.id.replace("UI-","").padStart(2,"0")}-p04-visual-parity.yml`,
          acceptance: "Playwright screenshot of every surface in this domain matches legacy screenshot with < 0.5% pixel variance at 1440×900 and 375×812. Every modal opens. Every form submits. Every toast shows correct text.",
        },
      ],
      acceptance: `ALL surfaces exist. ALL strings match legacy verbatim. Source parity test green. Playwright visual parity green (< 0.5% diff). Every modal, form, empty state, error state verified. Zero invented UI.`,
    },
  };
  tracker.tasks.push(task);
  console.log(`Added: ${def.id} — ~${def.estimatedSurfaces} surfaces`);
}

tracker.updatedOn = TODAY;
fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
console.log(`\ntracker.json updated. Total tasks: ${tracker.tasks.length}`);
console.log(`UI tasks: ${tracker.tasks.filter(t=>t.id?.startsWith("UI-")).length}`);
const totalEst = UI_TASKS.reduce((s,t) => s + t.estimatedSurfaces, 0);
console.log(`Estimated total surfaces: ~${totalEst}`);
