import fs from "fs";
import path from "path";

const builder = fs.readFileSync(
  path.join(process.cwd(), "src/components/Quiz/QuizBuilderModal.jsx"),
  "utf8"
);
const facultyList = fs.readFileSync(
  path.join(process.cwd(), "src/components/Quiz/Table/table.js"),
  "utf8"
);
const adminList = fs.readFileSync(
  path.join(process.cwd(), "src/pages/superadmin/sections/Quizzes.js"),
  "utf8"
);

test("quiz editor locks all assessment-defining fields after submissions and closed assessment release stays gated", () => {
  expect(builder).toContain("disabled={isEditMode && metadataOnly}");
  expect(builder).toContain("disabled={(isEditMode && metadataOnly) || closedDeadlineLocked}");
  expect(builder).toContain("deadline, attempt limit and randomization are locked");
  expect(facultyList).toContain("deadline, attempt limit and randomization are locked");
  expect(facultyList).toContain("Release after deadline");
  expect(adminList).toContain("deadline, attempt limit and randomization are locked");
  expect(adminList).toContain("Release after deadline");
});
