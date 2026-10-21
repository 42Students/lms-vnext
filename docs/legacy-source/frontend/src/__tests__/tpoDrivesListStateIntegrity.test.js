import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/tpo/drives/index.js"),
  "utf8"
);

test("drive-count failures stay unknown instead of becoming zero applicants or a guessed pipeline stage", () => {
  expect(src).toMatch(/const \[countsReady, setCountsReady\] = useState\(false\)/);
  expect(src).toMatch(/const \[countsError, setCountsError\] = useState\(null\)/);
  expect(src).toMatch(/if \(!c\) return null;/);
  expect(src).toMatch(/w\.key === "noapplicants" && !countsComplete\) return null/);
  expect(src).toMatch(/Applicant and pipeline counts are unavailable; count-dependent filters and shortcuts are hidden\./);
  expect(src).toMatch(/if \(!c\) return <Typography\.Text type="secondary">Unavailable<\/Typography\.Text>/);
});

test("a failed counts refresh preserves the last verified snapshot and exposes partial state", () => {
  expect(src).toMatch(/setDriveCounts\(Object\.fromEntries\(cnt\.data\.map/);
  expect(src).toMatch(/setCountsReady\(true\)/);
  expect(src).toMatch(/setCountsError\(cnt\?\.data\?\.message/);
  expect(src).toMatch(/Applicant and pipeline counts are from the last successful refresh\./);
  expect(src).toMatch(/message="Some drive data could not be verified"/);
});

test("batch and owner support-source failures are visible and retryable", () => {
  expect(src).toMatch(/const \[batchesError, setBatchesError\] = useState\(null\)/);
  expect(src).toMatch(/const \[teamError, setTeamError\] = useState\(null\)/);
  expect(src).toMatch(/Batch names are unavailable, so batch filters may be incomplete\./);
  expect(src).toMatch(/Drive owner names are unavailable\./);
  expect(src).toMatch(/Retry missing data/);
});
