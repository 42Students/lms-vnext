import {describe,expect,it} from "vitest";
import {learnerCourseListSignals} from "@/modules/courses/learner-course-overview-model";
describe("course card persisted progress context",()=>{
  const now=new Date("2026-10-14T10:00:00Z");
  it("does not invent progress or last activity when no denominator or persisted event exists",()=>{
    expect(learnerCourseListSignals([],{itemsTotal:0,overallPercent:0},now)).toEqual({
      percentage:null,lastActivity:null,nextDue:null,
    });
  });
  it("shows actual recorded completion and earliest still-open due",()=>{
    const done=new Date("2026-10-13T10:00:00Z");
    const result=learnerCourseListSignals([{contents:[{progress:{completedAt:done}}],
      assignments:[{title:"Essay",dueAt:new Date("2026-10-15T09:00:00Z"),submittedAt:null}],
      quizzes:[{title:"Exam",dueAt:new Date("2026-10-16T09:00:00Z"),progress:{status:"NOT_STARTED"}}]}],
      {itemsTotal:3,overallPercent:33},now);
    expect(result).toMatchObject({percentage:33,lastActivity:done.toISOString(),
      nextDue:{kind:"Assignment",title:"Essay"}});
  });
});
