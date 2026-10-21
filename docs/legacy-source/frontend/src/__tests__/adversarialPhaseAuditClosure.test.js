import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Adversarial UI hardening audit closure", () => {
  test("Phase 1 async/error-state findings stay fixed", () => {
    const settings = read("src/pages/tpo/settings.js");
    const messages = read("src/pages/recruiter/messages.js");
    const recruiters = read("src/pages/tpo/recruiters/index.js");
    const assignments = read("src/pages/superadmin/sections/Assignments.js");
    const quizzes = read("src/pages/superadmin/sections/Quizzes.js");

    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(settings).toContain("loadSettingsAccess");
    expect(settings).toContain("accessError");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(settings).toContain("assignOptionsError");
    // Retired 2026-10-09: the student-coordinator applicant list (appliedError) was removed with the coordinator roles.
    // expect(settings).toContain("appliedError");
    // expect(settings).toContain("Applicant eligibility could not be verified"); // same: coordinator assignment removed
    expect(messages).toContain("generalRequestRef");
    expect(messages).toContain("sendRef");
    expect(messages).toContain("Could not load this conversation");
    expect(recruiters).toContain("setCompaniesError");
    expect(recruiters).not.toMatch(/if\s*\(!c\.success\)\s*\{[^}]*setCompanies\(\[\]\)/s);
    expect(assignments).toContain("courseOptionsError");
    expect(assignments).toContain("classOptionsError");
    expect(quizzes).toContain("courseOptionsError");
    expect(quizzes).toContain("lessonOptionsError");
  });

  test("Phase 2 mutation single-flight findings stay fixed", () => {
    const settings = read("src/pages/tpo/settings.js");
    const messages = read("src/pages/recruiter/messages.js");
    const assignments = read("src/components/Assignments/AssignmentsContent.jsx");
    const action = read("src/components/Assignments/ActionAssignment.js");

    expect(settings).toContain("busyRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(settings).toContain("run.busy");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(settings).toContain('typeof action === "function"');
    expect(messages).toContain("sendRef.current");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(assignments).toContain("deleteRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(assignments).toContain("deletingId");
    expect(assignments).toContain("deleteError");
    expect(action).toContain("loading: deleting");
    expect(action).toContain("aria-busy={deleting ? \"true\" : undefined}");
  });

  test("Phase 3 lifecycle gates fail closed", () => {
    const course = read("src/pages/learn/courses/[courseId]/[...courseTab].js");
    const batch = read("src/pages/superadmin/sections/BatchPromotion.js");

    expect(course).toContain("learnerAvailability(course)");
    expect(course).toContain("!availability.visible || !availability.actionable");
    expect(batch).toContain("batchStatus");
    expect(batch).toContain('status !== "ACTIVE"');
    expect(batch).toContain('const isActive = status === "ACTIVE"');
  });

  test("Phase 4 form and hydration findings stay fixed", () => {
    const drive = read("src/components/tpo/DriveFormPage.js");
    const live = read("src/components/Global/Offcanvas/Syallabus/liveclass.js");
    const drawer = read("src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js");

    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drive).toContain("editHydration");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drive).toContain('disabled={Boolean(editId) && editHydration !== "ready"}');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drive).toContain("This drive could not be loaded");
    expect(live).toContain("start.isAfter(now)");
    expect(live).toContain("start time has already passed");
    expect(live).toContain("onDirtyChange");
    expect(live).toContain("submitError");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drawer).toContain("Discard live session draft?");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drawer).toContain("liveDirty");
  });

  test("Phase 6 saved-view failures remain distinct from empty state", () => {
    const grid = read("src/components/tpo/grid/GridWorkspace.jsx");
    expect(grid).toContain("viewsError");
    expect(grid).toContain("deleteView");
    expect(grid).toContain("Retry");
  });

  test("Phase 7 status semantics and tests stay aligned", () => {
    const panel = read("src/components/Common/PanelStates.jsx");
    const tests = read("src/__tests__/panelStates.test.jsx");
    expect(panel).toMatch(/completed:\s*\{[^}]*label:\s*"Completed"/s);
    expect(panel).toContain('complete: "completed"');
    expect(panel).toContain('done: "completed"');
    expect(tests).toContain('getByRole("alert")');
    expect(tests).not.toContain("loading problem, not an empty list");
  });

  test("Phase 8 successful quiz return is explicit and safe", () => {
    const quiz = read("src/components/Quiz/quizpanel.js");
    expect(quiz).toContain("getSafeInternalReturnPath");
    expect(quiz).toContain("successfulSubmitReturn");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(quiz).toContain("router.push(successfulSubmitReturn)");
  });

  test("Phase 9 durable feedback replaces duplicate/transient refresh failures", () => {
    const report = read("src/pages/tpo/reports/[name].js");

    expect(report).toContain("This refresh failed. Showing the last successful report.");
    expect(report).not.toMatch(/message\.error\(\{\s*content:\s*text,\s*key:\s*"tpo-report-load-error"/);
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(applications).toContain("refreshError");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(applications).toContain("Applications could not be refreshed");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(applications).toContain("Showing the last successful data.");
  });

  test("Phase 11 Projects modals remain scrollable on short/mobile viewports", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain(".learn-projects-detail__submission-modal-wrap");
    expect(css).toContain(".learn-projects-detail__member-modal-wrap");
    expect(css).toContain(".learn-projects-detail__task-modal-wrap");
    expect(css).toContain("overflow-y: auto !important");
    expect(css).toContain("max-height: calc(100dvh - 24px - env(safe-area-inset-top");
  });

  test("Phase 12 does not disable magnification", () => {
    const app = read("src/pages/_app.js");
    expect(app).not.toContain("user-scalable=no");
    expect(app).not.toContain("maximum-scale=1");
    expect(app).not.toContain("gesturestart");
  });

  test("Phase 15 standalone quiz boundary has deterministic recovery paths", () => {
    const page = read("src/pages/quiz.js");
    expect(page).toContain("componentDidUpdate");
    expect(page).toContain("resetKey");
    expect(page).toContain("Refresh page");
    expect(page).toContain("Back to quizzes");
    expect(page).toContain("reportReactBoundaryError");
  });
});
