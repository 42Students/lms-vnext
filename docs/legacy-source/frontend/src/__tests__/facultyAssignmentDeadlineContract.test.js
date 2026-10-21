import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/Global/Offcanvas/Assignment/newAssignment.js"),
  "utf8"
);

test("faculty assignment authoring sends one canonical deadline and freezes assessment rules after submissions", () => {
  expect(src).toMatch(/deadline:\s*persistedDueDate\?\.format\?\.\("YYYY-MM-DDTHH:mm:ss"\) \|\| null/);
  expect(src).toMatch(/due_date:\s*persistedDueDate\?\.toISOString\?\.\(\) \|\| ""/);
  expect(src).toContain("assessmentDefinitionLocked");
  expect(src).toContain("getAssignmentSubmissions");
});
