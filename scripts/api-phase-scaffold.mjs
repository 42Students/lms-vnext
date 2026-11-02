#!/usr/bin/env node
// Scaffold API phase: convert 10 milestone stubs into real tasks entries in tracker.json.
// Each task gets a workPlan with packages (endpoints per domain), acceptanceEvidence schema,
// dependsOn graph, and CI workflow placeholders.
// Run AFTER api-inventory-api*.json files exist in docs/planning/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
const TODAY = "2026-11-02";

// Load inventory files if they exist to get real endpoint counts
function loadInventory(milestoneId) {
  const num = milestoneId.replace("API-", "").padStart(2, "0");
  const p = path.join(root, `docs/planning/api-inventory-api${num}.json`);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  return null;
}

const API_TASKS = [
  {
    id: "API-01",
    title: "Shared database integrator and global certification — complete user-job integration",
    controllers: ["AuthController", "UserController", "SuperAdminCollegeController", "SuperAdminLearnerController", "SuperAdminFacultyController", "SuperAdminGlobalController", "SuperAdminBatchController", "CollegeController", "OrganizationController", "TenantAdminController", "FeatureFlagController"],
    vNextDirs: ["src/app/api/auth", "src/app/api/admin", "src/app/api/v1", "src/app/api/v2", "src/app/api/internal", "src/app/api/public"],
    dependsOn: ["DB-019", "DB-020"],
  },
  {
    id: "API-02",
    title: "Academics, groups and electives — complete user-job integration",
    controllers: ["BatchController", "ClassController", "SemesterController", "ProgramController", "ProgramStructureController", "NewProgramController", "ElectiveAdminController", "AdminGroupController", "LearnerGroupController", "DepartmentController", "LectureHallController", "ClassScheduleController", "AdminClassScheduleController", "FacultyClassScheduleController", "AnnouncementController"],
    vNextDirs: ["src/app/api/academics", "src/app/api/college", "src/app/api/colleges"],
    dependsOn: ["API-01"],
    relatedPlanningDoc: "docs/planning/db02-api-followup-after-database.md",
  },
  {
    id: "API-03",
    title: "Learner profiles, identity and private evidence — complete user-job integration",
    controllers: ["LearnerController", "LearnerProfileController", "FacultyController", "FacultyProfileController", "HrSelfController", "StudentImageController", "FileUploadController"],
    vNextDirs: ["src/app/api/people", "src/app/api/profile"],
    dependsOn: ["API-01"],
  },
  {
    id: "API-04",
    title: "Courses and learning content — complete user-job integration",
    controllers: ["CourseController", "LessonController", "LessonContentController", "FacultyLessonContentController", "AdminCourseBulkController", "StudentCourseController", "ResourceUploadController", "ResourceFileController", "SkillController"],
    vNextDirs: ["src/app/api/courses", "src/app/api/learn"],
    dependsOn: ["API-01"],
  },
  {
    id: "API-05",
    title: "Assignments, quizzes, grading and attendance — complete user-job integration",
    controllers: ["AssignmentController", "AdminAssignmentController", "AdminAssignmentContentWriteController", "AdminAssignmentPublishController", "QuizController", "AdminQuizController", "AdminAttendanceController", "AdminAttendancePolicyController", "AttendanceBulkController"],
    vNextDirs: ["src/app/api/attendance"],
    dependsOn: ["API-02"],
  },
  {
    id: "API-06",
    title: "Projects, templates, mentorship and history — complete user-job integration",
    controllers: ["ProjectWorkspaceController", "AdminProjectController", "AdminProjectTemplateController"],
    vNextDirs: ["src/app/api/projects", "src/app/api/mentor"],
    dependsOn: ["API-02"],
  },
  {
    id: "API-07",
    title: "Placement policies, applications and offer lifecycle — complete user-job integration",
    controllers: ["JobController", "PlacementJobController", "InterviewController", "CompanyController"],
    vNextDirs: ["src/app/api/placements"],
    dependsOn: ["API-03"],
  },
  {
    id: "API-08",
    title: "TPO and recruiter CRM — complete user-job integration",
    controllers: ["TpoController (and all Tpo* subcontrollers)", "RecruiterController (if exists)"],
    vNextDirs: ["src/app/api/tpo", "src/app/api/placements/tpo"],
    dependsOn: ["API-07"],
  },
  {
    id: "API-09",
    title: "Operations, notifications and outbound — complete user-job integration",
    controllers: ["NotificationController", "AdminNotificationDeliveryController", "AdminSmsLogController", "TelegramWebhookController", "DiscussionController"],
    vNextDirs: ["src/app/api/notifications", "src/app/api/tracker"],
    dependsOn: ["API-01"],
  },
  {
    id: "API-10",
    title: "Independent database safety, security and regression verification — complete user-job integration",
    controllers: ["ALL — cross-cutting security regression across all domains"],
    vNextDirs: ["src/app/api (all)"],
    dependsOn: ["API-01", "API-02", "API-03", "API-04", "API-05", "API-06", "API-07", "API-08", "API-09"],
  },
];

// Check if tasks already added
const existingApiTasks = tracker.tasks.filter(t => t.id?.startsWith("API-"));
if (existingApiTasks.length > 0) {
  console.log(`API tasks already exist: ${existingApiTasks.map(t=>t.id).join(", ")}`);
  console.log("Run with --force to overwrite.");
  if (!process.argv.includes("--force")) process.exit(0);
  // Remove existing API tasks
  tracker.tasks = tracker.tasks.filter(t => !t.id?.startsWith("API-"));
}

for (const def of API_TASKS) {
  const inv = loadInventory(def.id);
  const endpointCount = inv ? inv.totalEndpoints : null;
  const controllerCount = inv ? inv.controllers?.length : null;

  const task = {
    id: def.id,
    title: def.title,
    phase: "API",
    done: false,
    dependsOn: def.dependsOn,
    acceptedAt: null,
    acceptanceEvidence: [],
    workPlan: {
      schemaVersion: 1,
      scope: `${def.id}: ${def.title}`,
      frozenLegacyBackendSha: "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
      inventoryFile: `docs/planning/api-inventory-${def.id.toLowerCase().replace("-","")}.json`,
      legacyControllers: def.controllers,
      vNextRouteDirs: def.vNextDirs,
      ...(def.relatedPlanningDoc ? { relatedPlanningDoc: def.relatedPlanningDoc } : {}),
      ...(endpointCount !== null ? { legacyEndpointCount: endpointCount } : {}),
      ...(controllerCount !== null ? { legacyControllerCount: controllerCount } : {}),
      packages: [
        {
          id: `${def.id}-P01`,
          kind: "ENDPOINT_CROSSWALK",
          title: "Legacy endpoint → vNext crosswalk",
          done: false,
          acceptedAt: null,
          acceptanceEvidence: [],
          crosswalkFile: `docs/planning/api-crosswalk-${def.id.toLowerCase().replace("-","")}.json`,
          testFile: `tests/api${def.id.replace("API-","").padStart(2,"0")}-endpoint-crosswalk.test.mjs`,
          ciWorkflow: `.github/workflows/api${def.id.replace("API-","").padStart(2,"0")}-p01-crosswalk.yml`,
          acceptance: "Every legacy endpoint mapped to vNext route or explicitly RETIRED/REDESIGNED. No unmapped endpoints. Auth guard (isSameOriginRequest) confirmed on all mutations. Tenant scoping confirmed on all tenant-scoped routes.",
        },
        {
          id: `${def.id}-P02`,
          kind: "INTEGRATION_TESTS",
          title: "Producer → persisted record → consumer integration tests",
          done: false,
          acceptedAt: null,
          acceptanceEvidence: [],
          testFile: `tests/api${def.id.replace("API-","").padStart(2,"0")}-integration.test.ts`,
          ciWorkflow: `.github/workflows/api${def.id.replace("API-","").padStart(2,"0")}-p02-integration.yml`,
          acceptance: "Actual authorized producer creates/modifies a persisted record. Consumer reads it back correctly. Cross-role side effects verified. Tenant isolation: operations in tenant A must not be visible in tenant B. Error and not-found cases return correct HTTP status. Race/concurrency negatives executed for mutation-heavy flows.",
        },
      ],
      acceptance: `All legacy endpoints in scope classified (MAPPED/RETIRED/REDESIGNED). Producer→consumer integration tests pass on current main with PostgreSQL 17. Auth, tenant, error and concurrency contracts verified. CI workflow green on exact HEAD SHA.`,
    },
  };

  tracker.tasks.push(task);
  console.log(`Added task: ${def.id} — ${def.title}${endpointCount ? ` (${endpointCount} legacy endpoints)` : ""}`);
}

tracker.updatedOn = TODAY;
fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2) + "\n");
console.log(`\ntracker.json updated. Total tasks: ${tracker.tasks.length}`);
console.log(`API tasks: ${tracker.tasks.filter(t=>t.id?.startsWith("API-")).length}`);
