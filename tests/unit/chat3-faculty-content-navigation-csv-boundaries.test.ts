import { describe, expect, it } from "vitest";
import { filterFacultyAssessments } from "@/modules/courses/faculty-assessment-filter";
import {
  facultyMoveContentId,
  facultyContentOrderDirty,
  facultyContentOrderValid,
  facultyResetContentOrder,
  facultyContentOrderReceiptMatches,
} from "@/modules/courses/faculty-content-order-ui-model";
import { facultyNotificationActionHref } from "@/modules/courses/faculty-notification-link-model";
import {
  facultyQuizQuestionAccuracyCsv,
  FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS,
} from "@/modules/courses/faculty-quiz-question-csv";
import {
  facultyReportCsvHref,
  parseFacultyCsvDownloadUrl,
  facultyCsvAttachmentHeaders,
} from "@/modules/courses/faculty-report-csv-request";

const delivery = "11111111-1111-4111-8111-111111111111";
const assessment = "22222222-2222-4222-8222-222222222222";
const foreign = "33333333-3333-4333-8333-333333333333";

describe("FAC-BOUNDS-01 Faculty authorized assessment discovery", () => {
  const rows = [
    { deliveryId: delivery, status: "PUBLISHED", title: "Attendance quiz", description: null,
      courseCode: "ABC101", courseName: "Physics", sectionName: "A", lessonName: "Module 1" },
    { deliveryId: foreign, status: "PUBLISHED", title: "Attendance quiz", description: null,
      courseCode: "XYZ101", courseName: "Physics", sectionName: "B", lessonName: "Module 1" },
    { deliveryId: delivery, status: "DRAFT", title: "Assignment", description: "Seeded data",
      courseCode: "ABC101", courseName: "Physics", sectionName: "A", lessonName: "Module 2" },
  ];
  it("does not borrow a similarly named sibling delivery while filtering statuses", () => {
    const filtered = filterFacultyAssessments(rows, {
      deliveryId: delivery, status: "PUBLISHED", search: "  ATTENDANCE ",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].courseCode).toBe("ABC101");
    expect(filtered[0].sectionName).toBe("A");
    expect(filterFacultyAssessments(rows, { deliveryId: foreign, status: "DRAFT" })).toEqual([]);
    expect(rows).toHaveLength(3);
  });
});

describe("FAC-BOUNDS-02 Faculty content order state and stale receipt", () => {
  const initial = ["lesson-a", "lesson-b", "lesson-c"];
  it("moves exactly one position with no mutation of the input or wraparound", () => {
    expect(facultyMoveContentId(initial, 1, -1)).toEqual(["lesson-b", "lesson-a", "lesson-c"]);
    expect(facultyMoveContentId(initial, 1, 1)).toEqual(["lesson-a", "lesson-c", "lesson-b"]);
    for (const [index, delta] of [[-1, 1], [0, -1], [2, 1], [1, 0], [1.5, 1]]) {
      expect(facultyMoveContentId(initial, index, delta)).toEqual(initial);
    }
    expect(initial).toEqual(["lesson-a", "lesson-b", "lesson-c"]);
  });

  it("rejects duplicate, missing or foreign item IDs and detects only changed order", () => {
    expect(facultyContentOrderValid(initial, initial)).toBe(true);
    expect(facultyContentOrderValid(initial, ["lesson-a", "lesson-c", "lesson-b"])).toBe(true);
    expect(facultyContentOrderValid(initial, ["lesson-a", "lesson-b", foreign])).toBe(false);
    expect(facultyContentOrderValid(initial, ["lesson-a", "lesson-a", "lesson-c"])).toBe(false);
    expect(facultyContentOrderValid(initial, ["lesson-a"])).toBe(false);
    expect(facultyContentOrderValid(["lesson-a", "lesson-a"], ["lesson-a", "lesson-a"])).toBe(false);
    expect(facultyContentOrderDirty(initial, initial)).toBe(false);
    expect(facultyContentOrderDirty(initial, ["lesson-a", "lesson-c", "lesson-b"])).toBe(true);
    expect(facultyResetContentOrder([{ id: "fresh-1" }, { id: "fresh-2" }]))
      .toEqual(["fresh-1", "fresh-2"]);
  });

  it("accepts a saved receipt only for every ordered row in the exact delivery", () => {
    const receipt = {
      order: initial.map((lessonContentId, sequence) => ({
        lessonContentId, deliveryId: delivery, sequence,
      })),
    };
    expect(facultyContentOrderReceiptMatches(delivery, initial, receipt)).toBe(true);
    expect(facultyContentOrderReceiptMatches(foreign, initial, receipt)).toBe(false);
    expect(facultyContentOrderReceiptMatches(delivery, initial, null)).toBe(false);
    expect(facultyContentOrderReceiptMatches(delivery, initial, { order: receipt.order.slice(1) }))
      .toBe(false);
    expect(facultyContentOrderReceiptMatches(delivery, initial, {
      order: [...receipt.order].reverse(),
    })).toBe(false);
    expect(facultyContentOrderReceiptMatches(delivery, initial, {
      order: receipt.order.map(row => ({ ...row, sequence: 0 })),
    })).toBe(false);
  });
});

describe("FAC-BOUNDS-03 Faculty notification navigation", () => {
  it("permits scoped teacher deep links and preserves harmless search/hash fragments", () => {
    expect(facultyNotificationActionHref("/teacher/courses?tab=quizzes#pending"))
      .toBe("/teacher/courses?tab=quizzes#pending");
    expect(facultyNotificationActionHref("/teach/courses")).toBe("/teach/courses");
  });

  it("rejects external, wrong-role, encoded traversal, protocol-relative and control URL attacks", () => {
    for (const candidate of [
      null, "", "//evil.example/teacher", "https://evil.example/teacher",
      "javascript:alert(1)", "/admin/people", "/learn/projects",
      "/teacher/../admin", "/teacher/%2e%2e/admin",
      "/teacher\\evil.example", "/teacher\n/courses",
    ]) expect(facultyNotificationActionHref(candidate)).toBeNull();
  });
});

describe("FAC-BOUNDS-04 Faculty quiz question accuracy CSV", () => {
  it("quotes formulas, embedded delimiters and Unicode, includes aggregate only and truthful row cap", () => {
    const rows = Array.from({ length: FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS + 2 }, (_, index) => ({
      prompt: index === 0 ? '=HYPERLINK("evil"), తెలుగు' : "Question " + index,
      points: 2, answeredCount: 3, correctCount: 2, accuracyPercent: 66.67,
    }));
    const result = facultyQuizQuestionAccuracyCsv(rows);
    expect(result.omittedRows).toBe(2);
    expect(result.csv).toContain('"\'=HYPERLINK'); 
    expect(result.csv).toContain("2 more questions omitted by the 500-row cap.");
    expect(result.csv).not.toContain("Question 501");
    expect(result.csv).not.toContain("learnerEmail");
    expect(result.csv.endsWith("\r\n")).toBe(true);
  });
});

describe("FAC-BOUNDS-05 Faculty report CSV route construction and download scope", () => {
  it("rejects forged IDs, extra selector keys and duplicated delivery IDs", () => {
    const base = { kind: "assignment" as const, assessmentId: assessment };
    for (const query of [
      "deliveryId=" + delivery + "&deliveryId=" + foreign,
      "deliveryId=" + delivery + "&collegeId=" + foreign,
      "deliveryId=" + delivery + "&filter=GRADED&filter=LATE",
      "deliveryId=not-uuid",
    ]) {
      const url = "https://college.example/report?" + query;
      expect(() => parseFacultyCsvDownloadUrl(url, base)).toThrow();
    }
    expect(() => facultyReportCsvHref({
      ...base, deliveryId: delivery, collegeId: foreign,
    })).toThrow();
  });

  it("round trips assignment and quiz filter links without trusting the request query to select tenant", () => {
    const assignmentUrl = facultyReportCsvHref({
      kind: "assignment", assessmentId: assessment, deliveryId: delivery, filter: "GRADED",
    });
    expect(assignmentUrl).toContain("filter=GRADED");
    expect(parseFacultyCsvDownloadUrl("https://college.example" + assignmentUrl, {
      kind: "assignment", assessmentId: assessment,
    })).toMatchObject({ deliveryId: delivery, filter: "GRADED" });

    const quizUrl = facultyReportCsvHref({
      kind: "quiz", assessmentId: assessment, deliveryId: delivery, filter: "NOT_ATTEMPTED",
    });
    expect(quizUrl).toContain("filter=NOT_ATTEMPTED");
    expect(parseFacultyCsvDownloadUrl("https://college.example" + quizUrl, {
      kind: "quiz", assessmentId: assessment,
    })).toMatchObject({ kind: "quiz", deliveryId: delivery, filter: "NOT_ATTEMPTED" });
  });

  it("rejects injected attachment filenames and returns private download headers", () => {
    const headers = facultyCsvAttachmentHeaders("faculty-quiz-report-physics-a.csv");
    expect(headers["Cache-Control"]).toContain("no-store");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    for (const name of ["../../grades.csv", "faculty-quiz-report-x.csv\r\nSet-Cookie:x",
      "faculty-quiz-report-evil.xls", "faculty-quiz-report-x/other.csv"]) {
      expect(() => facultyCsvAttachmentHeaders(name)).toThrow();
    }
  });
});
