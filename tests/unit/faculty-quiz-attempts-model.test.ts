import {describe,expect,it} from "vitest";
import {facultyQuizAttemptsHref,facultyQuizAttemptsPage,facultyQuizAttemptsQuerySchema} from "@/modules/courses/faculty-quiz-attempts-model";

describe("Faculty Quiz attempt drill-down",()=>{
  const quizId="00000000-0000-4000-8000-000000000001";
  const deliveryId="00000000-0000-4000-8000-000000000002";
  it("rejects forged scope, missing delivery and unbounded pages",()=>{
    expect(facultyQuizAttemptsQuerySchema.safeParse({quizId,deliveryId}).success).toBe(true);
    expect(facultyQuizAttemptsQuerySchema.safeParse({quizId,deliveryId,collegeId:deliveryId}).success).toBe(false);
    expect(facultyQuizAttemptsQuerySchema.safeParse({quizId}).success).toBe(false);
    expect(facultyQuizAttemptsQuerySchema.safeParse({quizId,deliveryId,page:0}).success).toBe(false);
  });
  it("paginates persisted attempts newest-first and handles no attempts",()=>{
    const attempts=[
      {id:"a",submittedAt:new Date("2026-10-13T00:00:00Z")},
      {id:"b",submittedAt:new Date("2026-10-14T00:00:00Z")},
    ];
    expect(facultyQuizAttemptsPage(attempts,1).items.map(x=>x.id)).toEqual(["b","a"]);
    expect(facultyQuizAttemptsPage([],50)).toMatchObject({total:0,page:1,totalPages:1,items:[]});
    expect(facultyQuizAttemptsHref(quizId,deliveryId,2)).toBe("/teacher/report/quiz/"+quizId+"/attempts?deliveryId="+deliveryId+"&page=2");
  });
});
