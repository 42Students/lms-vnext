const fs = require("fs");
const path = require("path");

const source = (relative) =>
  fs.readFileSync(path.join(process.cwd(), "src", relative), "utf8");

describe("batch management hardening", () => {
  test("batch roster move uses the narrow placement endpoint instead of full learner update", () => {
    const page = source("pages/superadmin/sections/Batches.js");
    const api = source("api/Services/AdminService.js");
    expect(page).toContain("moveLearnerClass(learnerIdOf(movingStudent), moveTargetClassId)");
    expect(page).not.toContain("await updateLearner(learnerIdOf(movingStudent)");
    expect(api).toContain('/api/v1/learner/${id}/move-class');
    expect(page).toContain("No other section is available in this batch");
  });

  test("batch modal distinguishes failed class loading from an actually empty batch", () => {
    const page = source("pages/superadmin/sections/Batches.js");
    expect(page).toContain('message="Could not load classes"');
    expect(page).toContain('label="Loading batch sections"');
    expect(page).toContain('message="No classes in this batch yet"');
    expect(page).toContain("if (!studentsFor || manageClassId || classLoading || classError) return;");
    expect(page).toContain("fetchClassStudents(firstClass.id)");
  });

  test("promotion binds preview and mutation to the exact semester the admin confirmed", () => {
    const page = source("pages/superadmin/sections/BatchPromotion.js");
    expect(page).toContain("fetchPreview(batch.id, nextSem)");
    expect(page).toContain("previewBatchPromotion(batchId, effectiveNextSem)");
    expect(page).toContain("target_semester: effectiveNextSem");
    expect(page).toContain("freshPreview.currentSemester");
    expect(page).toContain("freshPreview.targetSemester");
  });

  test("academic years must be consecutive and promotion exposes its impact", () => {
    const batches = source("pages/superadmin/sections/Batches.js");
    const promotion = source("pages/superadmin/sections/BatchPromotion.js");
    expect(batches).toContain("isCanonicalAcademicYear");
    expect(batches).toContain("Batch Promotion advances it automatically");
    expect(promotion).toContain("isCanonicalAcademicYear");
    expect(promotion).toContain("assignmentsToDeactivateCount");
    expect(promotion).toContain("suggestedAcademicYear");
    expect(promotion).toContain("activeFacultyAssignmentCount");
  });
});
