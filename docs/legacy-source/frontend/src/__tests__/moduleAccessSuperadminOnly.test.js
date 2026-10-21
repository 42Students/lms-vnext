const fs = require("fs");
const path = require("path");
const source = (relative) => fs.readFileSync(path.join(process.cwd(), "src", relative), "utf8");

describe("superadmin-exclusive module allocation", () => {
  test("college admin has no module access route or navigation", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/pages/college-admin/module-access.js"))).toBe(false);
    const admin = source("common/lists.js").split("export const superAdminNavigationMenuFlat")[0];
    expect(admin).not.toContain('path: "module-access"');
    expect(source("common/lists.js")).toContain('{ modulename: "Module Access", path: "module-access"');
  });

  test("student bulk allocation and row selection are superadmin-only", () => {
    const students = source("pages/superadmin/sections/Students.js");
    expect(students).toContain("{isSuperAdmin && selectedStudentIds.length > 0 && (");
    expect(students).toContain("rowSelection={isSuperAdmin ? {");
    expect(students).toMatch(/const handleBulkModuleAccess = \(enabled\) => \{\s*if \(!isSuperAdmin\) return;/);
    expect(students).toMatch(/const applyBulkModuleAccess = async \(enabled\) => \{\s*if \(!isSuperAdmin\) return;/);
    expect(students).toContain("await setModuleAccessBulk({");
  });

  test("superadmin retains individual-student module access", () => {
    const page = source("pages/superadmin/module-access.js");
    expect(page).toContain("<ModuleAccess collegeId={selectedCollegeId} isSuperAdmin key={selectedCollegeId ?? \"none\"} />");
  });
});
