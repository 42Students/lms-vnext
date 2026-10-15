import {describe,expect,it} from "vitest";
import {learnerCourseListSignals} from "@/modules/courses/learner-course-overview-model";
describe("course card persisted progress context",()=>{
  const now=new Date("2026-10-14T10:00:00Z");
  it("does not invent progress or last activity when no denominator or persisted event exists",()=>{
    expect(learnerCourseListSignals([],{itemsTotal:0,overallPercent:0},now)).toEqual({
      percentage:null,lastActivity:null,overdueAssignments:0,nextDue:null,
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

describe("unknown or invalid progress", () => {
  it("does not show NaN as a measured learner Course percentage", () => {
    expect(learnerCourseListSignals([],{itemsTotal:2,overallPercent:Number.NaN},
      new Date("2026-10-15T00:00:00Z")).percentage).toBeNull();
    expect(learnerCourseListSignals([],{itemsTotal:2,overallPercent:120},
      new Date("2026-10-15T00:00:00Z")).percentage).toBe(100);
  });
});

describe("overdue assignment action signal", () => {
  it("counts only past due unsubmitted assignments, not submitted work", () => {
    const now = new Date("2026-10-15T10:00:00Z");
    const due = new Date("2026-10-14T10:00:00Z");
    const value = learnerCourseListSignals([{contents:[], quizzes:[],
      assignments:[{title:"Late essay",dueAt:due,submittedAt:null},
        {title:"Already submitted",dueAt:due,submittedAt:now}]}],
      {itemsTotal:2,overallPercent:50},now);
    expect(value.overdueAssignments).toBe(1);
  });
});

describe("Course card future deadlines",()=>{
 it("does not show missed/completed quiz as a next due action",()=>{
  const now=new Date("2026-10-15T10:00:00Z");
  const lessons=[{contents:[],assignments:[],quizzes:[
   {title:"Missed",dueAt:new Date("2026-10-17T10:00:00Z"),progress:{status:"MISSED"}},
   {title:"Available",dueAt:new Date("2026-10-18T10:00:00Z"),progress:{status:"NOT_STARTED"}},
  ]}];
  expect(learnerCourseListSignals(lessons,{itemsTotal:2,overallPercent:0},now).nextDue?.title).toBe("Available");
 });
 it("does not crash when a persisted quiz deadline is malformed",()=>{
  const lessons=[{contents:[],assignments:[],quizzes:[
   {title:"Invalid",dueAt:new Date(NaN),progress:{status:"NOT_STARTED"}},
  ]}];
  expect(learnerCourseListSignals(lessons,{itemsTotal:1,overallPercent:0},new Date("2026-10-15")).nextDue).toBeNull();
 });
});

describe("large learner activity histories",()=>{
  it("finds the newest stored event in a large published learning path",()=>{
    const lessons=Array.from({length:30000},(_,index)=>({
      contents:[{progress:{completedAt:new Date(1700000000000+index*1000)}}],
      assignments:[],quizzes:[],
    }));
    const result=learnerCourseListSignals(lessons,{itemsTotal:lessons.length,overallPercent:100},new Date("2026-10-15T10:00:00Z"));
    expect(result.lastActivity).toBe(new Date(1700000000000+29999*1000).toISOString());
  });
});

describe("in-progress quiz course-card deadlines",()=>{
 it("keeps a still-open in-progress attempt actionable",()=>{
  const due=new Date("2026-10-18T10:00:00Z");
  const result=learnerCourseListSignals([{contents:[],assignments:[],quizzes:[
   {title:"Resume quiz",dueAt:due,progress:{status:"IN_PROGRESS"}},
   {title:"Completed quiz",dueAt:due,progress:{status:"COMPLETED"}},
  ]}],{itemsTotal:2,overallPercent:0},new Date("2026-10-15T10:00:00Z"));
  expect(result.nextDue?.title).toBe("Resume quiz");
 });
});
