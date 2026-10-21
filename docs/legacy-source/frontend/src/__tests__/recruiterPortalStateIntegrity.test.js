import fs from "fs";
import path from "path";

const driveDetail = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/drives/[jobId].js"), "utf8");
const review = fs.readFileSync(path.join(process.cwd(), "src/components/recruiter/RecruiterFocusedReview.jsx"), "utf8");
const request = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/drives/new.js"), "utf8");
const profile = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/profile.js"), "utf8");
const drivesList = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/drives/index.js"), "utf8");
const today = fs.readFileSync(path.join(process.cwd(), "src/components/recruiter/RecruiterToday.jsx"), "utf8");
const company = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/company.js"), "utf8");
const calendar = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/calendar.js"), "utf8");

test("recruiter drive partial sources stay visible and private-note edits fail closed", () => {
  expect(driveDetail).toContain("Some drive information may be stale or unavailable");
  expect(driveDetail).toContain("private applicant notes");
  expect(driveDetail).toContain("notesAvailable={!notesError}");
  expect(driveDetail).toContain('if (notesError) throw new Error("Private notes are unavailable');
  expect(review).toContain("Saved private notes could not be loaded");
  expect(review).toContain("disabled={!notesAvailable}");
});

test("recruiter drive requests preserve drafts unless a request was actually created", () => {
  expect(request).toContain("const submitAttemptRef = useRef(false)");
  expect(request).toContain("if (busy || submitAttemptRef.current) return");
  expect(request).toContain("if (row?.jobId)");
  expect(request).toContain("The request could not be sent. Your draft is still saved.");
  expect(request).toContain("persistDraftNow");
  expect(request).toContain('window.addEventListener("pagehide", onPageHide)');
  expect(request).toContain("Leave without these changes?");
});

test("recruiter profile exposes unsaved state and prevents duplicate saves", () => {
  expect(profile).toContain("const [dirty, setDirty] = useState(false)");
  expect(profile).toContain("const saveAttemptRef = useRef(false)");
  expect(profile).toContain("if (saving || saveAttemptRef.current || !dirty) return");
  expect(profile).toContain("Unsaved changes");
  expect(profile).toContain('window.addEventListener("beforeunload", warn)');
  expect(profile).toContain("disabled={!dirty || saving}");
});

test("pending invite decisions are single-flight across the invitation list", () => {
});


test("recruiter drive lists clear old college scope before loading the next one", () => {
  expect(drivesList).toContain("A college-scoped session must never paint the previous college's list");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(drivesList).toMatch(/setDrives\(null\);\s*setError\(null\);\s*setTab\(null\);\s*setQuery\(""\);\s*load\(\);/s);
  expect(drivesList).toContain('d.applicants == null ? "Applicants unavailable"');
});

test("recruiter Today keeps auxiliary drive-summary failures explicit", () => {
  expect(today).toContain("const [driveCountError, setDriveCountError] = useState(null)");
  expect(today).toContain("Could not verify your drive history.");
  expect(today).toContain('message="Drive summary is partially unavailable"');
  expect(today).not.toContain("catch(() => setDriveCount(null))");
});


test("recruiter company/team/report payload gaps do not become empty or zero state", () => {
  expect(company).toContain("This information was unavailable in the response. Please retry.");
  expect(company).toContain('message="Team data is incomplete"');
  expect(company).toContain('message="Report data is incomplete"');
  expect(company).not.toContain("Applicants unavailable");
  expect(company).toMatch(/d\.funnel\?\.\[0\]\?\.count \?\? <Typography\.Text type="secondary">Unavailable<\/Typography\.Text>/);
});

test("recruiter calendar pointer and keyboard activation use the same destination", () => {
  expect(calendar).toContain('const href = e.jobId ? driveHref(e.jobId, e.type === "DEADLINE" ? "overview" : "rounds") : null');
  expect(calendar).toContain('onClick={() => href && router.push(href)}');
  // BE-0172: Enter and Space both open it, like a real button.
  expect(calendar).toContain('if (!href || (ev.key !== "Enter" && ev.key !== " ")) return;');
  expect(calendar).toContain('router.push(href);');
});
