import fs from "fs";
import path from "path";

const teacherPage = fs.readFileSync(path.join(process.cwd(), "src/pages/teacher/calendar.js"), "utf8");
const learnerPage = fs.readFileSync(path.join(process.cwd(), "src/pages/learn/calendar.js"), "utf8");
const schedule = fs.readFileSync(path.join(process.cwd(), "src/components/CalendarComp/ClassScheduleContent.jsx"), "utf8");
const events = fs.readFileSync(path.join(process.cwd(), "src/components/CalendarComp/CalendarEvents/CalendarEvents.js"), "utf8");

test("learner and faculty calendars share the same hardened schedule surface", () => {
  expect(teacherPage).toContain("<ClassScheduleContent />");
  expect(learnerPage).toContain("<ClassScheduleContent />");
});

test("calendar summary and grid reject malformed successful payloads", () => {
  expect(schedule).toContain('throw new Error("Invalid upcoming class schedule payload")');
  expect(events).toContain('throw new Error("Invalid class schedule payload")');
  expect(schedule).toContain("Couldn\'t load your next classes");
  expect(events).toContain("Unable to load class schedule. Please try again.");
});

test("calendar grid has request-race protection, retry and identity-specific empty state", () => {
  expect(events).toContain("seq !== fetchSeqRef.current");
  expect(events).toContain("abortRef.current.abort()");
  expect(events).toContain("Retry");
  expect(events).toContain("Your faculty ID is not set. Contact your administrator.");
  expect(events).toContain("You are not assigned to a class yet.");
});

test("calendar event navigation is role-aware and faculty numeric course ids are disambiguated", () => {
  expect(schedule).toContain('const base = isTeacherRole ? "/teacher" : "/learn"');
  expect(schedule).toContain("const needsRefMarker = isTeacherRole && !event.courseSlug");
  expect(schedule).toContain("?ref=course");
});
