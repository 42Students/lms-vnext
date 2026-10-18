import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseSuperAdminAssignmentQuery,parseSuperAdminQuizQuery} from "@/modules/admin-ui/super-admin-quiz-query-model";
import {adminAssessmentExportHref,adminAssessmentHref} from "@/modules/courses/admin-assessment-directory-model";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("SA-COURSES-CONTENT-AUDIT-01 assignments and quizzes route filters",()=>{
  it("rejects duplicate hostile page/query values rather than coercing them into a valid page",()=>{
    const valid=parseSuperAdminAssignmentQuery({q:"  lab  ",page:"2",status:"PUBLISHED",
      scope:"SECTION",courseCode:"CS101"});
    expect(valid.success).toBe(true);
    if(!valid.success)return;
    expect(valid.data.q).toBe("lab");
    expect(valid.data.page).toBe(2);
    for(const raw of [
      {page:["2"]},{page:"1.5"},{page:"-2"},{page:"Infinity"},
      {page:"1001"},{q:["one","two"]},{status:["ALL"]},
      {tenantId:"foreign"},{role:"SUPER_ADMIN"},
      {status:"CLOSED"},{results:"PUBLISHED"},{results:"HIDDEN"},
      {courseCode:"x".repeat(65)},
    ])expect(parseSuperAdminAssignmentQuery(raw).success).toBe(false);
    expect(parseSuperAdminAssignmentQuery({results:"ALL"}).success).toBe(true);
  });
  it("does not weaken quiz-only CLOSED and results publication filters",()=>{
    const quiz=parseSuperAdminQuizQuery({status:"CLOSED",results:"PUBLISHED",page:"3"});
    expect(quiz.success).toBe(true);
    if(!quiz.success)return;
    expect(adminAssessmentHref("QUIZ",quiz.data)).toContain("results=PUBLISHED");
    expect(adminAssessmentHref("QUIZ",quiz.data)).toContain("page=3");
    const exportHref=adminAssessmentExportHref("QUIZ",quiz.data);
    expect(exportHref).toContain("/api/admin/quizzes/export");
    expect(exportHref).toContain("results=PUBLISHED");
    expect(exportHref).not.toContain("page=");
    expect(parseSuperAdminQuizQuery({page:["3"]}).success).toBe(false);
  });
  it("wires explicit role scope and independent directory/authoring failures in assignments",()=>{
    const assignmentPage=read("src/app/(authenticated)/admin/assignments/page.tsx");
    const quizPage=read("src/app/(authenticated)/admin/quizzes/page.tsx");
    expect(assignmentPage).toContain("parseSuperAdminAssignmentQuery(raw)");
    expect(assignmentPage).toContain("if (!isSuperAdmin(context))");
    expect(assignmentPage).toContain("if (!context.adminScope?.collegeId)");
    expect(assignmentPage).toContain("Promise.allSettled([");
    expect(assignmentPage).toContain('if(dataResult.status==="rejected")');
    expect(assignmentPage).toContain('lessonsResult.status==="fulfilled"');
    expect(assignmentPage).toContain("Existing assignments remain visible");
    expect(assignmentPage).toContain("Retry loading assignments");
    expect(assignmentPage).not.toContain("throw dataResult.reason");
    expect(quizPage).toContain("parseSuperAdminQuizQuery(raw)");
    expect(quizPage).toContain("Promise.allSettled([");
    expect(quizPage).toContain('if(dataResult.status==="rejected")');
    expect(quizPage).toContain("Existing quizzes remain visible");
  });
});
