import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseSuperAdminQuizQuery} from "@/modules/admin-ui/super-admin-quiz-query-model";

describe("Super Admin last-third quiz directory, forged URL and outage contract",()=>{
  it("UX-admin-quizzes-01 valid quiz filters and defaults remain unchanged",()=>{
    expect(parseSuperAdminQuizQuery({})).toMatchObject({
      success:true,data:{q:"",status:"ALL",scope:"ALL",results:"ALL",page:1},
    });
    expect(parseSuperAdminQuizQuery({
      q:"  semester 5 ",status:"PUBLISHED",courseCode:"CS-101",
      scope:"SECTION",results:"HIDDEN",page:"10",
    })).toMatchObject({
      success:true,data:{q:"semester 5",status:"PUBLISHED",courseCode:"CS-101",
        scope:"SECTION",results:"HIDDEN",page:10},
    });
    expect(parseSuperAdminQuizQuery({courseCode:""}).success).toBe(true);
  });

  it("UX-admin-quizzes-02 unsafe and unsupported GET parameters never reach directory queries",()=>{
    for(const forged of [
      {page:"0"},{page:"1001"},{page:""},{page:" "},{page:"0x10"},
      {page:"1e2"},{page:"1.5"},{page:"Infinity"},{page:"-1"},
      {page:["1","2"]},{status:["ALL","ARCHIVED"]},
      {q:"x".repeat(101)},{collegeId:"other-tenant"},{sort:"secret"},
      {scope:"INJECTED"},{results:"INJECTED"},
    ]){
      expect(parseSuperAdminQuizQuery(forged).success,JSON.stringify(forged)).toBe(false);
    }
  });

  it("UX-admin-quizzes-03 caller checks validated query before selected-college reads",()=>{
    const page=readFileSync("src/app/(authenticated)/admin/quizzes/page.tsx","utf8");
    expect(page).toContain("parseSuperAdminQuizQuery(raw)");
    expect(page.indexOf("if (!query.success)")).toBeLessThan(page.indexOf("listCollegeAssessmentAggregate("));
    expect(page).toContain('title="Invalid quiz filters"');
    expect(page).toContain('href="/admin/quizzes"');
  });

  it("UX-admin-quizzes-04 independent loading failures never show false empty directories",()=>{
    const page=readFileSync("src/app/(authenticated)/admin/quizzes/page.tsx","utf8");
    expect(page).toContain("Promise.allSettled([");
    expect(page).toContain('dataResult.status==="rejected"');
    expect(page).toContain('title="Quizzes unavailable"');
    expect(page).toContain('Retry loading quizzes');
    expect(page).toContain('lessonsResult.status==="fulfilled"');
    expect(page).toContain('Existing quizzes remain visible.');
    expect(page).toContain('AdminAssessmentDirectory data={data}');
    expect(page).toContain('adminAssessmentExportHref("QUIZ",query.data)');
  });
});
