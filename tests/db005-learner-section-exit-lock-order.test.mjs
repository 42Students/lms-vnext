import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Structural guard only; the DB-005 PostgreSQL race acceptance remains a
// separate required gate before declaring task completion.
const roster = readFileSync(new URL(
  "../src/modules/academics/roster-service.ts", import.meta.url,
), "utf8");
const program = readFileSync(new URL(
  "../src/modules/academics/enrollment-service.ts", import.meta.url,
), "utf8");

test("assign locks live program enrollment before period and section", () => {
  const body = roster.slice(roster.indexOf("export async function assignLearnerToSection("));
  const parent = body.indexOf("const [liveEnrollment] = await tx");
  const period = body.indexOf("const [livePeriod] = await tx");
  const section = body.indexOf("const [liveSection] = await tx");
  const placements = body.indexOf("const activePlacements = await tx");
  assert.ok(parent >= 0 && parent < period && period < section && section < placements);
  assert.match(body.slice(parent, period), /\.from\(learnerProgramEnrollments\)[\s\S]*?\.for\("update"\)/);
  assert.match(body.slice(parent, period), /liveEnrollment\.status !== "ACTIVE"/);
  assert.match(body.slice(period, section), /\.from\(academicPeriods\)[\s\S]*?\.for\("share"\)/);
  assert.match(body.slice(section, placements), /\.from\(sections\)[\s\S]*?\.for\("update"\)/);
  assert.match(body.slice(section, placements), /liveSection\.status !== "ACTIVE"/);
});

test("program exit locks the same enrollment parent before ending placements", () => {
  const body = program.slice(program.indexOf("export async function transitionLearnerProgramEnrollment("));
  const parent = body.indexOf("const [liveEnrollment] = await tx");
  const children = body.indexOf(".update(sectionEnrollments)");
  const update = body.indexOf(".update(learnerProgramEnrollments)");
  assert.ok(parent >= 0 && parent < children && children < update);
  assert.match(body.slice(parent, children), /\.from\(learnerProgramEnrollments\)[\s\S]*?\.for\("update"\)/);
  assert.match(body.slice(parent, children), /liveEnrollment\.status !== "ACTIVE"/);
  assert.match(body.slice(children, update), /eq\(sectionEnrollments\.status, "ACTIVE"\)/);
});
