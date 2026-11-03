import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../src/components/projects/mentor-meetings-calendar.module.css", import.meta.url),
  "utf8",
);
const component = readFileSync(
  new URL("../src/components/projects/mentor-meetings-calendar.tsx", import.meta.url),
  "utf8",
);

test("mentor meeting details use one full-width grid track, not a compressed auto column", () => {
  const row = /\.row\s*\{([^}]*)\}/.exec(css)?.[1];
  assert.ok(row, "Meeting row selector must exist");
  assert.match(row, /display:\s*grid\s*;/);
  assert.match(row, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;/);
  assert.doesNotMatch(row, /grid-template-columns:[^;]*\bauto\b/);
  assert.match(row, /min-width:\s*0\s*;/);
});

test("request controls, provider status and notes remain in the meeting detail layout", () => {
  assert.match(component, /<MentorMeetingRequestActions meeting=\{meeting\}/);
  assert.match(component, /Recorded calendar integration status/);
  assert.match(component, /Recorded mentor notes and outcome/);
  assert.match(component, /<MentorMeetingFacilitationQuickEdit/);
});

const pageSource = readFileSync(
  new URL("../src/app/(authenticated)/mentor/calendar/page.tsx", import.meta.url),
  "utf8",
);

test("default meeting page restores old LMS Upcoming and Past & Cancelled lists", () => {
  assert.match(component, /className=\{styles\.legacyCalendar\}/);
  assert.match(component, /Upcoming \(\{upcoming\.length\}\)/);
  assert.match(component, /Past &amp; Cancelled \(\{past\.length\}\)/);
  assert.match(component, /No upcoming meetings\./);
  assert.match(component, /No past meetings yet\./);
  assert.match(component, /Open project/);
  assert.match(component, /className=\{styles\.legacyMeetingRow\}/);
  assert.match(css, /\.legacyMeetingRow\s*\{[^}]*flex-direction:\s*column/);
});

test("new meeting controls remain reachable through native details disclosures", () => {
  assert.match(component, /<details className=\{styles\.advancedCalendarTools\}>/);
  assert.match(component, /Meeting filters and calendar tools/);
  assert.match(component, /Add to my calendar \(\.ics\)/);
  assert.match(component, /Meeting details/);
  assert.match(pageSource, /<details className="min-w-0 text-sm">/);
  assert.match(pageSource, /Scheduling and Google Calendar/);
  assert.match(pageSource, /<MentorCalendarQuickSchedule projects=\{choices\}/);
  assert.match(pageSource, /<MentorGoogleCalendarAccount \{\.\.\.googleConnection\}/);
});
