import fs from "fs";
import path from "path";

const calendar = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/calendar.js"), "utf8");
const settings = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/settings.js"), "utf8");
const teamMembers = fs.readFileSync(path.join(process.cwd(), "src/components/tpo/team/TeamPeople.jsx"), "utf8");
const verification = fs.readFileSync(path.join(process.cwd(), "src/components/verification/VerificationWorkspace.jsx"), "utf8");
const report = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/reports/[name].js"), "utf8");

test("TPO calendar summary sources cannot fail into real-looking empty work counters", () => {
  expect(calendar).toContain("Calendar summary is partially unavailable");
  expect(calendar).toContain("Today&apos;s schedule could not be verified");
  expect(calendar).toContain("The next 7 days could not be verified.");
  expect(calendar).toContain("missing rows are not treated as zero");
});

test("TPO settings fail closed when admin access or destructive prerequisites are unknown", () => {
  expect(settings).toContain("Could not verify your placement-settings access.");
  // The team moved to its own module (N13); its removal guard went with it.
  expect(teamMembers).toContain("Could not verify what this team member owns. Retry before removing them.");
  expect(settings).toContain("disabled={coursesFailed}");
});

test("verification distinguishes temporary access failure from genuine denial and guards writes", () => {
  expect(verification).toContain("Could not check your verification access");
  expect(verification).toContain("onRetry={loadAccess}");
  expect(verification).toContain("Verification setting unavailable");
  expect(verification).toContain("if (busyRef.current) return");
  expect(verification).toContain("if (decisionRef.current) return");
  expect(verification).toContain("confirmLoading={Boolean(sendingBack)");
});

test("report batch dependency failure disables only the unverified batch filter", () => {
  expect(report).toContain("Batch filter unavailable");
  expect(report).toContain("Retry batches");
  expect(report).toContain("disabled={Boolean(batchesError)}");
});
