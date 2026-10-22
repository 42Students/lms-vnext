import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");

describe("chat-6 faculty audit evidence verified from current source",()=>{
  it("FAC-assessments-R01 supports published assignment title updates but locks restricted fields after submissions",()=>{
    const service=src("src/modules/courses/faculty-assignment-authoring-service.ts");
    const model=src("src/modules/courses/faculty-assignment-authoring-model.ts");
    expect(service).toContain('["DRAFT","PUBLISHED"].includes(current.status)');
    expect(service).toContain("facultyAssignmentEditLockedBySubmissions(changedFields,Boolean(submission))");
    expect(service).toContain('throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS")');
    expect(service).toContain("COURSES_ASSIGNMENT_UPDATED");
    expect(model).toContain("export function facultyAssignmentEditLockedBySubmissions");
    expect(src("src/components/courses/faculty-assessment-editor.tsx"))
      .toContain("You can still correct the title.");
  });
  it("FAC-assessments-R02 prevents published quiz deadline changes after attempts or closure",()=>{
    const service=src("src/modules/courses/faculty-quiz-authoring-service.ts");
    expect(service).toContain('current.status==="CLOSED"');
    expect(service).toContain("(current.dueAt?.getTime()??null)!==");
    expect(service).toContain("(input.dueAt?new Date(input.dueAt).getTime():null)");
    expect(service).toContain('throw new CoursesServiceError("QUIZ_HAS_ATTEMPTS")');
    expect(service).toContain(".for(\"update\")");
    expect(src("src/components/courses/faculty-assessment-editor.tsx"))
      .toContain("Quiz deadlines cannot change after learner attempts or closure.");
  });
  it("FAC-assessments-27 exposes one typed assessment-create entrypoint from the unified overview",()=>{
    const overview=src("src/components/courses/faculty-assessment-overview.tsx");
    const creator=src("src/components/courses/faculty-assessment-create.tsx");
    const quizzes=src("src/app/(authenticated)/teacher/allQuizzes/page.tsx");
    const assignments=src("src/app/(authenticated)/teacher/allAssignments/page.tsx");
    expect(overview).toContain("FacultyAssessmentCreate");
    expect(overview).toContain("overview.lessonChoices");
    expect(creator).toContain('kind:"ASSIGNMENT"|"QUIZ"');
    expect(quizzes).toContain("FacultyAssessmentOverview");
    expect(assignments).toContain("FacultyAssessmentOverview");
  });
  it("FAC-assessments-R05 honors the legacy content query only for an authorized quiz",()=>{
    const page=src("src/app/(authenticated)/teacher/allQuizzes/page.tsx");
    const overview=src("src/components/courses/faculty-assessment-overview.tsx");
    expect(page).toContain('searchParams:Promise<{content?:string}>');
    expect(page).toContain("initialQuizId");
    expect(page).toContain("getFacultyAssessmentOverview(context)");
    expect(page).toContain("initialQuizId={initialQuizId}");
    expect(overview).toContain('overview.quizzes.findIndex(item=>item.id===initialQuizId)');
    expect(overview).toContain('autoOpen={kind==="QUIZ"&&initialQuizId===item.id}');
  });
  it("FAC-assessments-R07 reveals exact learner-score rows when a quiz distribution bucket expands",()=>{
    const page=src("src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx");
    expect(page).toContain("Score distribution");
    expect(page).toContain("<Disclosure key={bucket.label}");
    expect(page).toContain('className="border-b border-[var(--lms-canvas-border)] p-2 text-sm [&>summary]:min-h-11');
    expect(page).toContain("latestAttempts.filter(attempt=>");
    expect(page).toContain("percent>=bucket.min&&percent<=bucket.max");
    expect(page).toContain("facultyReportLearnerName(attempt.learnerDisplayName)");
    expect(page).toContain("getFacultyQuizReport(context");
  });
});