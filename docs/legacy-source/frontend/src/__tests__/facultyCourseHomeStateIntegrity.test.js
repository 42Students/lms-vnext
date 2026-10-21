import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("faculty stats hook makes source reliability explicit and never defaults unknown grading to zero", () => {
  const src = read("src/hooks/useFacultyCourseStats.js");
  expect(src).toMatch(/const \[sourceErrors, setSourceErrors\]/);
  expect(src).toMatch(/submissionsReliable: !sourceErrors\.lessons && !sourceErrors\.submissions/);
  expect(src).toMatch(/pendingToGrade: \(!sourceErrors\.lessons && !sourceErrors\.submissions\)/);
  expect(src).toMatch(/reliable: failedContents\.length === 0/);
  expect(src).toMatch(/failedContents\.push/);
});

test("faculty course home does not render all-clear or zero metrics from unreliable sources", () => {
  const src = read("src/pages/Dashboard/course/Home/Home.js");
  expect(src).toMatch(/facultySubmissionSignalsReliable/);
  expect(src).toMatch(/title: "Pending work could not be verified"/);
  expect(src).toMatch(/value: facultySubmissionSignalsReliable \? formatCount\(facultyStats\.pendingToGrade\) : "—"/);
  expect(src).toMatch(/value: facultyAttendanceSignalsReliable \? formatPercent\(attendanceAverage\) : "—"/);
  expect(src).toMatch(/Retry signals/);
});
