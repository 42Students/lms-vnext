/**
 * UI-05 P03 — Source parity test (assignments, quizzes, attendance)
 * No browser needed. Fast (<30s).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function exists(rel) {
  return fs.existsSync(path.join(SRC, rel));
}

describe("UI-05 P03 — surface existence (assignments/quizzes/attendance)", () => {
  const surfaces = [
    // Admin assignments
    { id: "UI05-admin-assignments", path: "app/(authenticated)/admin/assignments/page.tsx" },
    { id: "UI05-college-assignments", path: "app/(authenticated)/college/assignments/page.tsx" },
    // Admin quizzes
    { id: "UI05-admin-quizzes", path: "app/(authenticated)/admin/quizzes/page.tsx" },
    { id: "UI05-college-quizzes", path: "app/(authenticated)/college/quizzes/page.tsx" },
    // Admin attendance
    { id: "UI05-admin-attendance", path: "app/(authenticated)/admin/attendance/page.tsx" },
    { id: "UI05-college-attendance", path: "app/(authenticated)/college/attendance/page.tsx" },
    { id: "UI05-attendance-settings", path: "app/(authenticated)/college/attendance/settings/page.tsx" },
    { id: "UI05-attendance-departments", path: "app/(authenticated)/college/attendance/departments/page.tsx" },
    { id: "UI05-attendance-corrections", path: "app/(authenticated)/college/attendance/corrections/page.tsx" },
    // Learner
    { id: "UI05-learn-assignments", path: "app/(authenticated)/learn/allAssignments/page.tsx" },
    { id: "UI05-learn-assignment-detail", path: "app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx" },
    { id: "UI05-learn-quizzes", path: "app/(authenticated)/learn/allQuizzes/page.tsx" },
    { id: "UI05-learn-quiz-detail", path: "app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx" },
    { id: "UI05-learn-attendance", path: "app/(authenticated)/learn/attendance/page.tsx" },
    { id: "UI05-learn-attendance-calendar", path: "app/(authenticated)/learn/attendance/calendar/page.tsx" },
    { id: "UI05-learn-quiz-attempts", path: "app/(authenticated)/learn/quizzes/my-attempts/page.tsx" },
    { id: "UI05-learn-assignments-nav", path: "app/(authenticated)/learn/assignments/page.tsx" },
    { id: "UI05-learn-quizzes-nav", path: "app/(authenticated)/learn/quizzes/page.tsx" },
    // Teacher
    { id: "UI05-teacher-assignments", path: "app/(authenticated)/teacher/allAssignments/page.tsx" },
    { id: "UI05-teacher-quizzes", path: "app/(authenticated)/teacher/allQuizzes/page.tsx" },
    { id: "UI05-teacher-gradebook", path: "app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx" },
    { id: "UI05-teacher-gradebook-learner", path: "app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx" },
    { id: "UI05-teacher-assignments-manage", path: "app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx" },
    { id: "UI05-teacher-quizzes-manage", path: "app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx" },
    { id: "UI05-teacher-report-assignment", path: "app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx" },
    { id: "UI05-teacher-report-assignment-subs", path: "app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx" },
    { id: "UI05-teacher-report-assignment-grade", path: "app/(authenticated)/teacher/report/assignment/[contentId]/grade/page.tsx" },
    { id: "UI05-teacher-report-quiz", path: "app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx" },
    { id: "UI05-teacher-report-quiz-attempts", path: "app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx" },
    { id: "UI05-teacher-attendance-detail", path: "app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx" },
    { id: "UI05-teacher-attendance-corrections", path: "app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx" },
    { id: "UI05-quiz-page", path: "app/quiz/page.tsx" },
  ];

  for (const s of surfaces) {
    it(`${s.id} exists on disk`, () => {
      assert.ok(exists(s.path), `MISSING ${s.id}: src/${s.path}`);
    });
  }
});

describe("UI-05 P03 — inventory completeness", () => {
  const INVENTORY_FILE = path.join(ROOT, "docs/planning/ui-inventory-ui05.json");

  it("inventory file exists", () => {
    assert.ok(fs.existsSync(INVENTORY_FILE), "ui-inventory-ui05.json not found");
  });

  it("has 40+ surfaces", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    assert.ok(inv.surfaces.length >= 40, `Expected 40+ surfaces, got ${inv.surfaces.length}`);
  });

  it("every surface has required fields", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    for (const s of inv.surfaces) {
      assert.ok(s.id);
      assert.ok(s.type);
      assert.ok(["MATCHED","MISSING","REDESIGNED"].includes(s.disposition), `${s.id}: ${s.disposition}`);
    }
  });
});

describe("UI-05 P03 — string catalogue", () => {
  const STRINGS_FILE = path.join(ROOT, "docs/planning/ui-strings-ui05.json");
  it("string catalogue exists", () => {
    assert.ok(fs.existsSync(STRINGS_FILE), "ui-strings-ui05.json not found");
  });
});
