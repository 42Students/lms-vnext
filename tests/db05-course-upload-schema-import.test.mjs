import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const stagedReceipts = read("../src/db/schema/course-upload-receipts-staged.ts");
const assessments = read("../src/db/schema/assessments.ts");
const courses = read("../src/db/schema/courses.ts");

test("DB05/DB06 upload receipts resolve lessonContents from its actual schema owner", () => {
  assert.match(
    stagedReceipts,
    /import \{ courseAssignments, assignmentSubmissions \} from "\.\/assessments";/,
  );
  assert.match(
    stagedReceipts,
    /import \{ lessonContents \} from "\.\/courses";/,
  );
  assert.doesNotMatch(
    stagedReceipts,
    /import \{[^}]*lessonContents[^}]*\} from "\.\/assessments";/,
  );
  assert.match(courses, /export const lessonContents = pgTable\(/);
  assert.doesNotMatch(assessments, /export const lessonContents\b/);
});

test("staged receipt references preserve assignment and lesson foreign key targets", () => {
  assert.match(assessments, /export const courseAssignments = pgTable\(/);
  assert.match(assessments, /export const assignmentSubmissions = pgTable\(/);
  assert.match(stagedReceipts, /references\(\(\) => courseAssignments\.id/);
  assert.match(stagedReceipts, /references\(\(\) => lessonContents\.id/);
  assert.match(stagedReceipts, /references\(\(\) => assignmentSubmissions\.id/);
  assert.match(stagedReceipts, /W01 owns migration registration\/index export/);
});
