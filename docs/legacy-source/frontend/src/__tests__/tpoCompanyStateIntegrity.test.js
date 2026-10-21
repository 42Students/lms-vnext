import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/tpo/companies.js"),
  "utf8"
);

test("TPO company drive-count failures are explicit partial state", () => {
  expect(src).toMatch(/const \[countsError, setCountsError\] = useState\(null\)/);
  expect(src).toMatch(/Drive application counts are unavailable/);
  expect(src).toMatch(/Retry counts/);
  expect(src).toMatch(/countsError\s*\? <Typography\.Text type="secondary">Unavailable<\/Typography\.Text>/);
});
