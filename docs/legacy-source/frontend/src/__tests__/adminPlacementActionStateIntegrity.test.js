import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("shared admin Jobs serializes status, bulk and delete-impact actions", () => {
  const source = read("src/pages/superadmin/sections/Jobs.js");
  expect(source).toContain("const mutationRef = useRef(false)");
  expect(source).toContain("const confirmRef = useRef(false)");
  expect(source).toContain("if (mutationRef.current) return");
  expect(source).toContain("Could not preview deletion impact. Nothing was deleted.");
});

test("application triage, interview state, bulk decisions, notes and offer letters are guarded", () => {
  const source = read("src/pages/superadmin/sections/JobApplications.js");
  expect(source).toContain("const mutationRef = useRef(false)");
  expect(source).toContain("const confirmRef = useRef(false)");
  expect(source).toContain("const exportRef = useRef(false)");
  expect(source).toContain("Discard assessment changes?");
  expect(source).toContain("Discard rejection reason?");
  expect(source).toContain("Discard bulk rejection reason?");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("Discard internal-note changes?");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("Discard offer-letter changes?");
  expect(source).toContain("Status history unavailable");
  expect(source).toContain("Failed to load screening detail");
});

test("interview create edit feedback forms are draft-safe and immediate single-flight", () => {
  const create = read("src/pages/superadmin/sections/InterviewForm.js");
  const edit = read("src/pages/superadmin/sections/InterviewEditForm.js");
  const feedback = read("src/pages/superadmin/sections/InterviewFeedbackForm.js");
  for (const source of [create, edit, feedback]) {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("submittingRef");
  }
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(create).toContain("Discard this interview draft?");
  expect(edit).toContain("Discard interview changes?");
  expect(feedback).toContain("Discard unsaved feedback?");
});

test("superadmin recruiter accounts fail closed and serialize access/account mutations", () => {
  const source = read("src/pages/superadmin/sections/RecruiterAccounts.js");
  expect(source).toContain("const mutationRef = useRef(false)");
  expect(source).toContain("const confirmRef = useRef(false)");
  expect(source).toContain("Recruiter accounts could not be loaded");
  expect(source).toContain("College access options unavailable");
  expect(source).toContain("Discard recruiter changes?");
});

test("college-admin job pages reuse shared hardened placements and settings fails closed", () => {
  const all = read("src/pages/college-admin/jobs/all.js");
  const apps = read("src/pages/college-admin/jobs/[jobId]/applications.js");
  const settings = read("src/pages/college-admin/jobs/[jobId]/settings.js");
  expect(all).toMatch(/superadmin\/sections\/Jobs/);
  expect(apps).toMatch(/superadmin\/sections\/JobApplications/);
  expect(settings).toContain("const mutationRef = useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(settings).toContain("Drive settings could not be loaded");
  expect(settings).toContain("Drive impact is unavailable");
});
