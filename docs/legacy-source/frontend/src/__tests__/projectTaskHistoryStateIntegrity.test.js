import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("task-history failure stays distinct from genuine no-comments/no-activity state", () => {
  const detail = read("src/components/Projects/ProjectDetailContent.jsx");
  const modal = read("src/components/Projects/modals/TaskDetailsModal.jsx");

  expect(detail).toMatch(/const \[taskDetailLoadError, setTaskDetailLoadError\] = useState\(null\)/);
  expect(detail).toMatch(/setTaskDetailLoadError\(err\?\.response\?\.data\?\.message \|\| err\?\.message \|\| "Failed to load task history\."/);
  expect(modal).toMatch(/message="Task history unavailable"/);
  expect(modal).toMatch(/Retry history/);
  expect(modal).toMatch(/taskDetailLoadError \? null : activityEvents\.length === 0/);
  expect(modal).toMatch(/taskDetailLoadError \? null : discussionComments\.length === 0/);
});

test("successful project task writes do not become false write failures when history refresh fails", () => {
  const detail = read("src/components/Projects/ProjectDetailContent.jsx");
  expect(detail).toMatch(/Task update saved, but the history could not be refreshed/);
  expect(detail).toMatch(/The task was updated, but its history could not be refreshed/);
  expect(detail).toMatch(/The submission was saved, but task history could not be refreshed/);
});
