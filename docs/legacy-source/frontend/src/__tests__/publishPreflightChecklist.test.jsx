/**
 * UI/UX audit, Tier C "Publish Pre-flight" (2026-10-01): publishing used to be a single click with
 * an eligibility-count modal and no check for the things that actually break a drive once it's
 * live - no CTC, no deadline, no rounds, no eligibility rules, an off-campus drive with nowhere to
 * apply. The server refuses the same blocking items (TpoDriveService.publishBlockers).
 */
import { buildPublishChecklist } from "@/components/tpo/drive/publishPreflight";

const baseJob = {
  jobType: "FULL_TIME", // the server refuses a drive with no job type
  roleOptionsJson: [{ name: "Default", ctcLpa: 8 }],
  applicationDeadline: "2099-12-01T00:00:00",
  eligibilityJson: { minCgpa: 6.5 },
  driveMode: "ON_CAMPUS",
};

test("a fully set up drive has nothing blocking and nothing to warn about", () => {
  const { blocking, warnings } = buildPublishChecklist(baseJob, [{ id: 1 }]);
  expect(blocking).toEqual([]);
  expect(warnings).toEqual([]);
});

test("no CTC on any role option blocks publish", () => {
  const job = { ...baseJob, roleOptionsJson: [{ name: "Default" }] };
  const { blocking } = buildPublishChecklist(job, [{ id: 1 }]);
  expect(blocking.map((b) => b.key)).toContain("ctc");
});

test("no application deadline blocks publish", () => {
  const job = { ...baseJob, applicationDeadline: null };
  const { blocking } = buildPublishChecklist(job, [{ id: 1 }]);
  expect(blocking.map((b) => b.key)).toContain("deadline");
});

test("an off-campus drive with no company link blocks publish", () => {
  const job = { ...baseJob, driveMode: "OFF_CAMPUS", externalApplyUrl: null };
  const { blocking } = buildPublishChecklist(job, [{ id: 1 }]);
  expect(blocking.map((b) => b.key)).toContain("link");
});

test("an off-campus drive WITH a company link does not block", () => {
  const job = { ...baseJob, driveMode: "OFF_CAMPUS", externalApplyUrl: "https://acme.com/apply" };
  const { blocking } = buildPublishChecklist(job, [{ id: 1 }]);
  expect(blocking.map((b) => b.key)).not.toContain("link");
});

test("no rounds and no eligibility rules warn but don't block", () => {
  const job = { ...baseJob, eligibilityJson: {} };
  const { blocking, warnings } = buildPublishChecklist(job, []);
  expect(blocking).toEqual([]);
  expect(warnings.map((w) => w.key)).toEqual(expect.arrayContaining(["rounds", "eligibility"]));
});

test("an eligibility rule with an empty array still counts as no rule set", () => {
  const job = { ...baseJob, eligibilityJson: { branches: [] } };
  const { warnings } = buildPublishChecklist(job, [{ id: 1 }]);
  expect(warnings.map((w) => w.key)).toContain("eligibility");
});
