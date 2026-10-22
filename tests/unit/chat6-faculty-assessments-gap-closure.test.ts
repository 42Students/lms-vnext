import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

/** Read-only source contracts: the orchestrator also runs behaviour and DB tests. */
const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-6 Faculty assessments verified gap closure",()=>{
  it("FAC-assessments-02 allowed legacy submission methods",()=>{
    const src0=source("src/modules/courses/assignment-submission-methods.ts");
    expect(src0).toContain("WRITTEN_RESPONSE");
    expect(src0).toContain("PDF_UPLOAD");
    expect(src0).toContain("FILE_UPLOAD");
    expect(src0).toContain("REPOSITORY_LINK");
    expect(src0).toContain("EXTERNAL_LINK");
    const src1=source("src/components/courses/faculty-assignment-method-picker.tsx");
    expect(src1).toContain("Allowed submission methods");
  });
  it("FAC-assessments-03 quiz shuffle controls and persisted options",()=>{
    const src0=source("src/components/courses/faculty-choice-quiz-builder.tsx");
    expect(src0).toContain("Shuffle question order per learner");
    expect(src0).toContain("Shuffle answer options per learner");
    expect(src0).toContain("shuffleQuestions,shuffleOptions");
    const src1=source("src/modules/courses/faculty-quiz-authoring-service.ts");
    expect(src1).toContain("shuffleQuestions");
    expect(src1).toContain("shuffleOptions");
  });
  it("FAC-assessments-04 due dates required for publishing",()=>{
    const src0=source("src/components/courses/faculty-choice-quiz-builder.tsx");
    expect(src0).toContain("Due date (IST, required before publishing)");
    const src1=source("src/components/courses/faculty-assignment-editor.tsx");
    expect(src1).toContain("Due date (IST, required before publishing)");
    const src2=source("src/modules/courses/faculty-quiz-authoring-service.ts");
    expect(src2).toContain("current.dueAt.getTime()<=Date.now()");
  });
  it("FAC-assessments-05 deadline-driven quiz result release",()=>{
    const src0=source("src/components/courses/faculty-assessment-operation-model.ts");
    expect(src0).toContain("deadlineReached");
    expect(src0).toContain("canPublishResults");
    const src1=source("src/modules/courses/quiz-service.ts");
    expect(src1).toContain("locked.dueAt.getTime()<=Date.now()");
  });
  it("FAC-assessments-06 single-click grade save and publication",()=>{
    const src0=source("src/components/courses/faculty-assignment-review.tsx");
    expect(src0).toContain("async function saveAndPublish");
    expect(src0).toContain("Grade submitted. The learner can now see the score.");
    expect(src0).toContain("Submit grade");
  });
  it("FAC-assessments-07 grade publication and submission notifications",()=>{
    const src0=source("src/modules/courses/assignment-submission-service.ts");
    expect(src0).toContain("tx.insert(inAppNotifications)");
    expect(src0).toContain("COURSES_ASSIGNMENT_GRADE_PUBLISHED");
  });
  it("FAC-assessments-08 release and withhold confirmations",()=>{
    const src0=source("src/components/courses/faculty-quiz-review.tsx");
    expect(src0).toContain("Release results?");
    expect(src0).toContain("Withhold results?");
    expect(src0).toContain("Release results");
    expect(src0).toContain("Withhold results");
  });
  it("FAC-assessments-09 faculty learner-style quiz preview",()=>{
    const src0=source("src/components/courses/faculty-quiz-learner-preview.tsx");
    expect(src0).toContain("Preview Quiz");
    expect(src0).toContain("No learner attempts are created.");
    expect(src0).toContain("Show answer key");
  });
  it("FAC-assessments-10 legacy quiz list status vocabulary",()=>{
    const src0=source("src/components/courses/faculty-assessment-overview.tsx");
    expect(src0).toContain("Needs due date");
    expect(src0).toContain("Draft");
    expect(src0).toContain("Open");
    expect(src0).toContain("Closed");
  });
  it("FAC-assessments-16 delete confirmation copy and history protection",()=>{
    const src0=source("src/components/courses/faculty-assessment-lifecycle-model.ts");
    expect(src0).toContain("Delete this quiz?");
    expect(src0).toContain("Delete this assignment?");
    expect(src0).toContain("This cannot be undone.");
  });
  it("FAC-assessments-17 legacy faculty empty states",()=>{
    const src0=source("src/components/courses/faculty-assessment-overview.tsx");
    expect(src0).toContain("No quizzes yet");
    expect(src0).toContain("No assignments yet");
    expect(src0).toContain("Create your first quiz to get started.");
    expect(src0).toContain("Create your first assignment to get started.");
  });
  it("FAC-assessments-18 per-question 100 point limit",()=>{
    const src0=source("src/components/courses/faculty-choice-quiz-builder.tsx");
    expect(src0).toContain("max={100}");
    const src1=source("src/modules/courses/faculty-quiz-builder-model.ts");
    expect(src1).toContain("q.points>100");
  });
  it("FAC-assessments-19 per-assignment 1000 point limit",()=>{
    const src0=source("src/components/courses/faculty-assignment-editor.tsx");
    expect(src0).toContain("max={1000}");
    const src1=source("src/components/courses/faculty-lesson-authoring.tsx");
    expect(src1).toContain("points > 1000");
  });
  it("FAC-assessments-21 grading student navigation and picker",()=>{
    const src0=source("src/components/courses/faculty-assignment-review.tsx");
    expect(src0).toContain("Submission student navigation");
    expect(src0).toContain("Previous student");
    expect(src0).toContain("Next student");
    expect(src0).toContain("Students (");
  });
  it("FAC-assessments-23 grade pending and graded points wording",()=>{
    const src0=source("src/components/courses/faculty-assignment-review.tsx");
    expect(src0).toContain("Not graded");
    expect(src0).toContain("Graded, not published");
    expect(src0).toContain("Submit grade");
  });
  it("FAC-assessments-29 stacked mobile assessment and grading actions",()=>{
    const src0=source("src/components/courses/faculty-assessment-overview.tsx");
    expect(src0).toContain("grid-cols-2");
    expect(src0).toContain("min-w-0");
    expect(src0).toContain("sm:flex");
    const src1=source("src/components/courses/faculty-assignment-review.tsx");
    expect(src1).toContain("grid-cols-2");
    expect(src1).toContain("sm:flex");
  });
  it("FAC-assessments-30 legacy all courses filter",()=>{
    const src0=source("src/components/courses/faculty-assessment-overview.tsx");
    expect(src0).toContain("<option value=\"\">All courses</option>");
  });
  it("FAC-assessments-25 NOT-A-GAP legacy overview fields now shown",()=>{
    const src0=source("src/components/courses/faculty-assessment-overview.tsx");
    expect(src0).toContain("{item.courseName} · {item.sectionName} · {item.lessonName}");
    expect(src0).toContain("Draft · hidden from students");
    expect(src0).toContain("Needs due date");
    expect(src0).toContain("Draft · hidden from students");
  });
  it("FAC-assessments-26 NOT-A-GAP zero-submission draft review supported",()=>{
    const src0=source("src/components/courses/faculty-assignment-review.tsx");
    expect(src0).toContain("if(status===\"DRAFT\")");
    expect(src0).toContain('<EmptyState title="No submissions yet" description="Publish this assignment to allow students to submit work."');
  });
  it("FAC-assessments-28 NOT-A-GAP report headings and download exist",()=>{
    const src0=source("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx");
    expect(src0).toContain("Score distribution");
    expect(src0).toContain("Submission timing");
    expect(src0).toContain("Student scores");
    const src1=source("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx");
    expect(src1).toContain("Question accuracy");
    expect(src1).toContain("Score distribution");
    expect(src1).toContain("Student scores");
    const src2=source("src/components/courses/faculty-report-download.tsx");
    expect(src2).toContain("Download PDF");
  });
});
