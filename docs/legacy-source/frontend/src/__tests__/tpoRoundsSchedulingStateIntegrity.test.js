import fs from "fs";
import path from "path";

const rounds = fs.readFileSync(
  path.join(process.cwd(), "src/components/tpo/drive/RoundsTab.js"),
  "utf8"
);
const schedule = fs.readFileSync(
  path.join(process.cwd(), "src/components/tpo/drive/ScheduleModal.js"),
  "utf8"
);

test("completed or dependency-bearing rounds do not expose doomed mutations", () => {
  expect(rounds).toMatch(/const terminalRound = \(r\) => \["COMPLETED", "CANCELLED"\]\.includes/);
  expect(rounds).toMatch(/const deleteBlocked = \(r\) => roundReadOnly\(r\) \|\| Number\(r\?\.inRound\) > 0 \|\| Number\(r\?\.stagedResults\) > 0/);
  expect(rounds).toMatch(/disabled=\{roundReadOnly\(r\)\} onClick=\{\(\) => setImportRound\(r\)\}/);
  expect(rounds).toMatch(/readOnly=\{scheduleRound \? roundReadOnly\(scheduleRound\) : readOnly\}/);
});

test("blocked-date and schedule dependency failures stay explicit", () => {
  expect(rounds).toMatch(/Blocked-date check is unavailable/);
  expect(schedule).toMatch(/message="Schedule data is partially unavailable"/);
  expect(schedule).toMatch(/Slots could not be verified\./);
  expect(schedule).toMatch(/Existing assignments could not be verified\./);
});

test("reschedule move cannot submit without a confirmed slot", () => {
  expect(schedule).toMatch(/if \(!slotId\)/);
  expect(schedule).toMatch(/Choose a confirmed slot before moving the student\./);
  expect(schedule).toMatch(/return Promise\.reject\(new Error\("slot required"\)\)/);
});
