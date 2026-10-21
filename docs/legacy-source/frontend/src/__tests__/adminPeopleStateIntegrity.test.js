import fs from "fs";
import path from "path";

const students = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Students.js"), "utf8");
const faculty = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Faculty.js"), "utf8");
const assignments = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/FacultyAssignment.js"), "utf8");

test("student account actions fail closed when academic placement lookups are unknown", () => {
  expect(students).toContain("classesLookupError");
  expect(students).toContain("programsLookupError");
  expect(students).toContain("Some academic placement options are unavailable");
  expect(students).toContain("Classes unavailable for this program");
  expect(students).toContain("Discard student edits?");
  expect(students).toContain("const [rowActionBusy, setRowActionBusy] = useState(null)");
  expect(students).toContain("Impersonation did not return a session token");
});

test("faculty account department and lifecycle states fail closed", () => {
  expect(faculty).toContain("const [departmentsError, setDepartmentsError] = useState(null)");
  expect(faculty).toContain("const [bulkDepartmentsError, setBulkDepartmentsError] = useState(null)");
  expect(faculty).toContain("Discard faculty edits?");
  expect(faculty).toContain("const [rowActionBusy, setRowActionBusy] = useState(null)");
  expect(faculty).toContain("Impersonation did not return a session token");
  expect(faculty).toContain("disabled={departmentsLoading || Boolean(departmentsError)}");
});

test("faculty assignment edit cannot bypass failed lookup prerequisites", () => {
  expect(assignments).toContain("Reload the selection options before editing this assignment.");
  expect(assignments).toContain("Selection options are unavailable. Retry them before saving.");
  expect(assignments).toContain("const [deletingId, setDeletingId] = useState(null)");
  expect(assignments).toContain("okButtonProps={{ disabled: lookupsLoading || Object.keys(lookupErrors).length > 0 || Boolean(semesterError) }}");
});
