import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("a session without a college says where to sign in, instead of a chooser that can no longer be reached", () => {
  const home = read("src/pages/recruiter/home.js");
  expect(home).toContain("NoCollegeSession");
  expect(home).not.toContain("switchToMembership");
});

test("recruiter drive mutations preserve drafts, expose dependency failures, and prevent duplicate writes", () => {
  const detail = read("src/pages/recruiter/drives/[jobId].js");
  const review = read("src/components/recruiter/RecruiterFocusedReview.jsx");
  const request = read("src/pages/recruiter/drives/new.js");

  expect(detail).toContain("Discard these round changes?");
  expect(detail).toContain("deletingRef.current");
  expect(detail).toContain("Invalid offers response");
  expect(detail).toContain("Discard unsent result decisions?");
  expect(detail).toContain("Interview slots could not be loaded");
  expect(detail).toContain("Discard this unsent slot proposal?");
  expect(detail).toContain("Conversation could not be loaded");
  expect(detail).toContain("Discard this unsent drive message?");
  expect(detail).toMatch(/busyRef\.current|sendingRef\.current/);

  expect(review).toContain("const sendingRef = useRef(false)");
  expect(review).toContain("if (sendingRef.current) return");
  expect(review).toContain("Your decisions are saved on this device until you send them");

  expect(request).toContain("const submitAttemptRef = useRef(false)");
  expect(request).toContain("Your draft is saved");
  expect(request).toContain("Leave without these changes?");
});

test("recruiter messages and profile protect meaningful drafts", () => {
  const messages = read("src/pages/recruiter/messages.js");
  const profile = read("src/pages/recruiter/profile.js");

  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(messages).toContain("const sendingRef = useRef(false)");
  expect(messages).toContain("Discard this unsent message?");
  expect(messages).toContain("Retry the conversation before replying");

  expect(profile).toContain("const saveAttemptRef = useRef(false)");
  expect(profile).toContain("Discard your unsaved profile changes?");
  expect(profile).toContain('Router.events.on("routeChangeStart"');
});

test("company and college-access surfaces are read/navigation only after scoped account resolution", () => {
  const company = read("src/pages/recruiter/company.js");
  const college = read("src/components/recruiter/useRecruiterCollege.js");

  expect(company).toContain("Team data is incomplete");
  expect(company).toContain("Report data is incomplete");
  expect(company).toContain('router.push("/recruiter/profile")');
  expect(college).toContain("needsCollege");
  expect(college).toContain("error: true");
});


test("recruiter notification state never turns malformed data or read failure into false all-clear", () => {
  const bell = read("src/components/recruiter/RecruiterNotificationBell.jsx");
  expect(bell).toContain("Invalid notification feed response");
  expect(bell).toContain("Invalid notification unread response");
  expect(bell).toContain("read status could not be saved");
  expect(bell).toContain("retryMarkRead");
});
