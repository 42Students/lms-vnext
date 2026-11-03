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
