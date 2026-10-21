const fs = require("fs");
const path = require("path");

const source = (relative) =>
  fs.readFileSync(path.join(process.cwd(), "src", relative), "utf8");

describe("college admin UI hardening", () => {
  test("college-scoped Courses never renders the global policy editor", () => {
    const s = source("pages/superadmin/sections/Courses.js");
    // Global policy is deliberately restricted to the unscoped superadmin path.
    // Check the actual guard, not the whitespace/parentheses of a previous JSX layout.
    expect(s).toContain('!isScoped && basePath === "/superadmin"');
    expect(s).toContain('scopeType="GLOBAL"');
    expect(s).toContain("Platform-wide setting, available in unscoped Super Admin mode.");
  });

  test.each([
    ["Departments", "pages/superadmin/sections/Departments.js", "Failed to load departments"],
    ["Programs", "pages/superadmin/sections/Programs.js", "Failed to load programs"],
    ["Batches", "pages/superadmin/sections/Batches.js", "Failed to load batches"],
    ["Classes", "pages/superadmin/sections/Classes.js", "Failed to load classes"],
    ["Courses", "pages/superadmin/sections/Courses.js", "Could not load courses"],
    ["Faculty", "pages/superadmin/sections/Faculty.js", "Failed to load faculty"],
    ["Lessons", "pages/superadmin/sections/Lessons.js", "Could not load lessons"],
  ])("%s distinguishes fetch failure from empty data", (_name, file, message) => {
    const s = source(file);
    expect(s).toContain("loadError");
    expect(s).toContain(message);
    expect(s).toContain("Retry");
  });

  test("courses load failure clears stale rows instead of looking like a successful empty state", () => {
    const s = source("pages/superadmin/sections/Courses.js");
    expect(s).toContain('if (!result.success) throw new Error(result.message || "Could not load courses")');
    // Same-scope refresh failures keep the last rows (with Retry); a scope change clears them.
    expect(s).toMatch(/catch \(error\) \{[\s\S]*?setLoadError\(error\?\.message \|\| "Could not load courses"\)[\s\S]*?if \(scopeChanged\) setData\(\[\]\);/);
    expect(s).toContain("if (!isScoped)");
    expect(s).toContain('locale={{ emptyText: loadError ? "Could not load courses. Use Retry above."');
  });

  test("semester listing loads college programs instead of faking an empty list", () => {
    const s = source("pages/superadmin/sections/SemesterManagement.js");
    expect(s).toContain("Promise.all");
    expect(s).toContain("getSemestersByProgram(program.id)");
    expect(s).toContain("setSelectedProgram(values.programId)");
    expect(s).toContain("r.semester_number ?? r.semesterNumber");
  });

  test("departments no longer expose chair / vice chair, which nothing in the product reads", () => {
    const s = source("pages/superadmin/sections/Departments.js");
    expect(s).not.toContain("deptChairId");
    expect(s).not.toContain("deptViceChairId");
    expect(s).not.toContain("dept_chair_id");
    expect(s).not.toContain("Faculty #");
  });

  test("shared semester management requires an explicit semester name", () => {
    const s = source("pages/superadmin/sections/SemesterManagement.js");
    expect(s).not.toContain("Semester Name (Optional)");
    expect(s).toContain('label="Semester Name"');
    expect(s).toContain('{ required: true, whitespace: true, message: "Please enter semester name" }');
    expect(s).toContain('const name = String(values.name ?? "").trim();');
    expect(s).not.toContain('values.name ?? `Semester ${semesterNumber}`');
  });

  test("shared class form uses academic structure and schedules instead of duplicate lifecycle dates", () => {
    const s = source("pages/superadmin/sections/Classes.js");
    expect(s).not.toContain('name="startDate" label="Start Date"');
    expect(s).not.toContain('name="endDate" label="End Date"');
    expect(s).not.toContain("start_date: dateKey(values.startDate)");
    expect(s).not.toContain("end_date: dateKey(values.endDate)");
    expect(s).toContain("Class dates follow the batch/semester academic structure.");
    expect(s).toContain("Schedule actual teaching dates from the Schedule action.");
  });

  test("shared batches keep program ownership immutable and do not expose semester bypasses", () => {
    const s = source("pages/superadmin/sections/Batches.js");
    expect(s).toContain("disabled={Boolean(optionsError) || editing}");
    expect(s).toContain("The program can't be changed once the batch exists.");
    expect(s).not.toContain("currentStudents: 0");
    expect(s).not.toContain("Set semester");
    expect(s).not.toContain("updateBatchSemester");
    expect(s).not.toContain("StepForwardOutlined");
  });

  test("shared batch roster management never moves learners across batches or into group-backed classes", () => {
    const s = source("pages/superadmin/sections/Batches.js");
    expect(s).toContain('classTypeOf(row) !== "GROUP_BACKED"');
    expect(s).toContain("batchClassOptions.find");
    expect(s).toContain("Cross-batch or cross-program transfers require a");
    expect(s).toContain(".filter((c) => !idEq(c.id, manageClassId))");
    expect(s).not.toContain("Choose the class (in any batch)");
  });

  test("shared batch promotion is a one-step server-verified workflow without unsafe undo", () => {
    const s = source("pages/superadmin/sections/BatchPromotion.js");
    expect(s).not.toContain("UndoOutlined");
    expect(s).not.toContain("updateBatchSemester");
    expect(s).not.toContain('name="target_semester"');
    expect(s).toContain("Server-verified promotion is ready");
    expect(s).toContain("mappedCourseCount");
    expect(s).toContain("staffingReady");
    expect(s).toContain("setLoadError");
    expect(s).toContain("setProgramError");
  });

  test("student search, recents, and load errors are tenant/account scoped", () => {
    const s = source("pages/superadmin/sections/Students.js");
    expect(s).toContain("searchLearners(query.trim(), 15, collegeId)");
    expect(s).toContain("recentLearners:${loginUser?.userType");
    expect(s).toContain("sessionStorage.setItem(recentLearnersKey");
    expect(s).toContain("getPopularLearners(10, collegeId)");
    expect(s).toContain("That learner is not in the current college roster.");
    expect(s).toContain("Could not load student roster");
  });

  test("faculty search and recents are tenant scoped and college admin cannot grant admin role", () => {
    const s = source("pages/superadmin/sections/Faculty.js");
    expect(s).toContain("searchFaculty(query.trim(), 15, collegeId)");
    expect(s).toContain("recentFaculty:${loginUser?.id");
    expect(s).toContain("That faculty member is not in the current college roster.");
    expect(s).toContain('{isSuperAdmin && <Option value="ADMIN">');
    expect(s).toContain('placeholder="Faculty role is managed separately" disabled');
  });

  test("legacy mentor routes redirect into projects and teacher file explorer redirects into courses", () => {
    expect(source("pages/mentor/fileExplorer.js")).toContain('destination: "/mentor/projects"');
    expect(source("pages/mentor/courses/index.js")).toContain('destination: "/mentor"');
    expect(source("pages/teacher/fileExplorer.js")).toContain('destination: "/teacher/courses"');
  });
});
