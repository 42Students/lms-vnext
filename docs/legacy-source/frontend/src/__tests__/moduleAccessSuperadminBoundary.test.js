const fs = require("fs");
const path = require("path");

const src = (file) => fs.readFileSync(path.join(process.cwd(), "src", file), "utf8");

describe("Module Access management stays Superadmin-only", () => {
  test("the College Admin module-access route is absent, not just hidden in the sidebar", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/pages/college-admin/module-access.js"))).toBe(false);
  });

  test("College Admin navigation has no Module Access route but Superadmin keeps it", () => {
    const lists = src("common/lists.js");
    const collegeMenu = lists.split("export const adminNavigationMenuFlat = () => [")[1]
      .split("export const adminNavigationMenuForSidebar")[0];
    const superMenu = lists.split("export const superAdminNavigationMenuFlat = () => [")[1]
      .split("export const superAdminNavigationMenuForSidebar")[0];
    expect(collegeMenu).not.toContain('path: "module-access"');
    expect(superMenu).toContain('path: "module-access"');
  });

  test("Superadmin page still requires a selected college and exposes per-learner controls", () => {
    const page = src("pages/superadmin/module-access.js");
    const component = src("pages/superadmin/sections/ModuleAccess.js");
    expect(page).toContain("selectedCollegeId == null");
    expect(page).toContain("<ModuleAccess collegeId={selectedCollegeId} isSuperAdmin key={selectedCollegeId ?? \"none\"} />");
    expect(component).toContain("learner");
  });

  test("shared Students screen hides selection and bulk actions from College Admin, and guards both handlers", () => {
    const students = src("pages/superadmin/sections/Students.js");
    expect(students).toContain('loginUser?.id === 0 && loginUser?.userType === "FACULTY"');
    expect(students).toContain("{isSuperAdmin && selectedStudentIds.length > 0 && (");
    expect(students).toContain("rowSelection={isSuperAdmin ? {");
    expect(students).toMatch(/const handleBulkModuleAccess = \(enabled\) => \{\s*if \(!isSuperAdmin\) return;/);
    expect(students).toMatch(/const applyBulkModuleAccess = async \(enabled\) => \{\s*if \(!isSuperAdmin\) return;/);
    // Shared student registration and normal editing must survive the module-only restriction.
    expect(students).toContain("registerLearner(payload)");
    expect(students).toContain("updateLearner(");
  });
});
