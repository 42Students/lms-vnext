import fs from "fs";
import path from "path";

const batchPage = fs.readFileSync(
  path.join(process.cwd(), "src/pages/tpo/batches/[batchId].js"),
  "utf8"
);
const grid = fs.readFileSync(
  path.join(process.cwd(), "src/components/tpo/batches/EligibilityGrid.jsx"),
  "utf8"
);

test("batch roster and placement-enrichment failures are explicit partial states", () => {
  expect(batchPage).toMatch(/const \[studentsError, setStudentsError\] = useState\(null\)/);
  expect(batchPage).toMatch(/const \[profilesError, setProfilesError\] = useState\(null\)/);
  expect(batchPage).toMatch(/message="Student roster unavailable"/);
  expect(batchPage).toMatch(/message="Some student placement details are unavailable"/);
  expect(batchPage).toMatch(/message="Batch details may be stale"/);
});

test("finished or unverified batch state makes every eligibility-grid mutation path read-only", () => {
  expect(batchPage).toMatch(/readOnly=\{finished \|\| Boolean\(studentsError\) \|\| Boolean\(profilesError\)\}/);
  expect(grid).toMatch(/readOnly = false/);
  expect(grid).toMatch(/if \(column\.field === "ownChoice"\) next\.editable = !readOnly/);
  expect(grid).toMatch(/if \(readOnly \|\| typeof decide !== "function"\)/);
  expect(grid).toMatch(/tools=\{onImport && !readOnly/);
  expect(grid).toMatch(/act=\{readOnly \? undefined : act\}/);
});
