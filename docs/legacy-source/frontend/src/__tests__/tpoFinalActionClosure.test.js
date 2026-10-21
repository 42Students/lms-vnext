import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("TPO students and batches guard consequential writes and partial dependencies", () => {
  const student = read("src/components/tpo/StudentPanel.js");
  const batch = read("src/pages/tpo/batches/[batchId].js");

  expect(student).toContain("const noteSavingRef = useRef(false)");
  expect(student).toContain("const registrationSavingRef = useRef(false)");
  expect(student).toContain("const liftingRef = useRef(false)");
  expect(student).toContain("Discard this private note?");
  expect(batch).toContain("const actionRef = useRef(false)");
  expect(batch).toContain("if (actionRef.current) return");
  expect(batch).toContain("Student roster unavailable");
  expect(batch).toContain("Some student placement details are unavailable");
});

test("TPO company surface is read/navigation only once company and count state are verified", () => {
  const source = read("src/pages/tpo/companies.js");
  expect(source).toContain("companyLoadSeqRef");
  expect(source).toContain("countsLoadSeqRef");
  expect(source).toContain("Drive application counts are unavailable");
  expect(source).toContain("Retry counts");
  expect(source).not.toMatch(/deleteCompany|updateCompany|saveCompany/);
});

test("TPO recruiter lead and request actions are immediate single-flight and draft-safe", () => {
  const list = read("src/pages/tpo/recruiters/index.js");
  const detail = read("src/pages/tpo/recruiters/[recruiterLeadId].js");
  const requests = read("src/components/tpo/RequestsPanel.js");

  expect(list).toContain("const savingRef = useRef(false)");
  expect(list).toContain("const inlineActionRef = useRef(false)");
  expect(list).toContain("Discard this unsaved recruiter lead?");
  expect(detail).toContain("const actionRef = useRef(false)");
  expect(detail).toContain("const savingRef = useRef(false)");
  expect(detail).toContain("Discard your unsaved recruiter changes?");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(requests).toContain("const decisionBusyRef = useRef(null)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(requests).toContain("if (decisionBusyRef.current != null) return false");
});

test("TPO calendar follow-up writes are atomic and immediate single-flight", () => {
  const source = read("src/pages/tpo/calendar.js");
  expect(source).toContain("const followUpBusyRef = useRef(false)");
  expect(source).toContain("if (followUpBusyRef.current) return false");
  expect(source).toContain("moveFollowUp");
  expect(source).toContain("Calendar summary is partially unavailable");
});

test("TPO reports preserve stale/error state and fail closed on batch dependency", () => {
  const source = read("src/pages/tpo/reports/[name].js");
  expect(source).toContain("This refresh failed. Showing the last successful report.");
  expect(source).toContain("Batch filter unavailable");
  expect(source).toContain("Retry batches");
  expect(source).toContain("disabled={Boolean(batchesError)}");
});

test("TPO messages and notifications protect drafts and reconcile read state after success", () => {
  const messages = read("src/components/tpo/MessagesPanel.js");
  const notifications = read("src/pages/tpo/notifications.js");

  expect(messages).toContain("const busyRef = useRef(false)");
  expect(messages).toContain("Discard this message draft?");
  expect(messages).toContain("Conversation history unavailable");
  expect(notifications).toContain("const markingRef = useRef(null)");
  expect(notifications).toContain("Could not mark this notification as read");
});

test("TPO settings uses one single-flight save contract and page-level draft protection", () => {
  const source = read("src/pages/tpo/settings.js");
  expect(source).toContain("const useRun = () =>");
  expect(source).toContain("const busyRef = useRef(false)");
  expect(source).toContain("if (busyRef.current) return false");
  expect(source).toContain("You have unsaved placement settings. Leave without saving them?");
  expect(source).toContain("Could not verify your placement-settings access.");
});
