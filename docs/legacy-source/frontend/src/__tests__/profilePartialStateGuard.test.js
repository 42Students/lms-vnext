import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("partial profile fetch failures stay visible and preserve last-known section data", () => {
  const src = read("src/components/profile/about.js");
  expect(src).toMatch(/const \[sectionLoadErrors, setSectionLoadErrors\] = useState\(\[\]\)/);
  expect(src).toMatch(/const applyResult = \(result, fallback, setter\) => \{/);
  expect(src).toMatch(/if \(value !== undefined\) setter\(value\)/);
  expect(src).toMatch(/Some profile sections could not be loaded/);
  expect(src).toMatch(/Retry sections/);
  expect(src).toMatch(/Last known data is kept where available/);
});
