import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("mentor notifications distinguish partial broad-feed failure from a genuine all-clear state", () => {
  const src = read("src/pages/mentor/notifications.js");
  expect(src).toMatch(/Promise\.allSettled/);
  expect(src).toMatch(/sourceErrors/);
  expect(src).toMatch(/Some notification sources are unavailable/);
  expect(src).toMatch(/Retry sources/);
  expect(src).toMatch(/No project alerts are visible, but some notification sources could not be checked/);
});

test("mentor feature lookup failure is not presented as Projects being disabled", () => {
  const landing = read("src/pages/mentor/index.js");
  const projects = read("src/pages/mentor/projects/index.js");
  expect(landing).toMatch(/failed/);
  expect(landing).toMatch(/Could not verify Projects access/);
  expect(projects).toMatch(/if \(failed\)/);
  expect(projects).toMatch(/This does not mean Projects is disabled/);
  expect(projects).toMatch(/Retry access check/);
});
