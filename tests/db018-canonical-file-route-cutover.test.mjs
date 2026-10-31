import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const upload = read("src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts");
const submit = read("src/modules/courses/assignment-submission-service.ts");
const download = read("src/app/api/courses/assignment-submissions/[submissionId]/file/route.ts");
const canonical = read("src/modules/courses/assignment-submission-file-service.ts");

test("legacy upload route binds to registered DB016 private-file grants", () => {
  assert.match(upload, /issueSubmissionFileUploadGrant/);
  assert.doesNotMatch(upload, /createAssignmentFileUploadGrant/);
  assert.match(canonical, /\.insert\(assignmentSubmissionFiles\)/);
});

test("legacy FILE submissions use the registered one-shot transaction", () => {
  const helper = submit.indexOf("async function submitCanonicalFileIfRequested(");
  const entry = submit.indexOf("export async function submitCourseAssignment(", helper);
  const fallback = submit.indexOf("const assignment =\n    await loadCourseAssignmentScope(", entry);
  assert.ok(helper > 0 && entry > helper && fallback > entry);
  const compatibility = submit.slice(helper, entry);
  assert.match(compatibility, /input\.submissionType !== "FILE"/);
  assert.match(compatibility, /submitAssignmentWithFiles\(context, assignmentId/);
  assert.match(compatibility, /uploadReceiptIds/);
  assert.match(compatibility, /return toLearnerSubmission/);
  const publicRoute = submit.slice(entry, fallback);
  assert.match(publicRoute, /await submitCanonicalFileIfRequested\(context, assignmentId, input\)/);
  assert.match(publicRoute, /if \(canonicalFile\) return canonicalFile/);
  assert.match(canonical, /\.orderBy\(asc\(assignmentSubmissionFiles\.id\)\)/);
  assert.match(canonical, /\.for\("update"\)/);
  assert.match(canonical, /STORAGE_FILE_NOT_READY/);
});

test("legacy submitted-file redirect uses registered authorization and signed read", () => {
  assert.match(download, /listSubmissionFiles\(context, submissionId\)/);
  assert.match(download, /issueSubmissionFileDownloadGrant/);
  assert.doesNotMatch(download, /createAssignmentFileReadGrant/);
  assert.match(canonical, /authorizeFileRead\(context, row\)/);
  assert.match(canonical, /issueObjectReadUrl/);
});

test("original DB053 race gate is retained, not silently replaced", () => {
  const original = read("tests/integration/db18-assignment-receipt-race.test.ts");
  const gate = read(".github/workflows/db018-full-gate-acceptance.yml");
  assert.match(original, /P5-R13_REGISTERED_RECEIPT_SCHEMA_MISSING/);
  assert.match(gate, /db18-assignment-receipt-race\.test\.ts -t P5-R13/);
});
