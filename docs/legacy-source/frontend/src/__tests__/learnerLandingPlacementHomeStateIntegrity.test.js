import fs from "fs";
import path from "path";

const landing = fs.readFileSync(path.join(process.cwd(), "src/pages/learn/index.js"), "utf8");
const placements = fs.readFileSync(path.join(process.cwd(), "src/pages/learn/my-placements/index.js"), "utf8");

test("learner dashboard route intentionally redirects to Courses", () => {
  expect(landing).toContain('Location: "/learn/courses"');
  expect(landing).toContain("getServerSideProps");
});

test("placement home never shows a failed read as nothing to do, and shows no counts", () => {
  // Student redesign (14 Oct 2026): one read of the journey + overview, a failure is a Retry, never an empty home.
  expect(placements).toContain("useJourney()");
  expect(placements).toContain("We could not load your placements");
  expect(placements).toContain("onClick={reload}");
  // No stat cards: the student's own small numbers are not shown back to them.
  expect(placements).not.toMatch(/Open jobs|Application pipeline|Assessments<\/|None upcoming/);
});
