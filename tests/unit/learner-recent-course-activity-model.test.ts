import {describe,expect,it} from "vitest";
import {learnerRecentCourseActivity} from "@/modules/courses/learner-recent-course-activity-model";
const now=new Date("2026-10-14T12:00:00Z").getTime();
describe("recent learner Course Home activity from saved events",()=>{
  it("includes saved content completion and submission, not future or stale events",()=>{
    const result=learnerRecentCourseActivity([{id:"lesson",contents:[
      {id:"a",title:"Video",type:"VIDEO",progress:{completedAt:new Date("2026-10-14T10:00:00Z")}},
      {id:"stale",title:"Old",type:"RESOURCE",progress:{completedAt:new Date("2026-09-01T00:00:00Z")}},
      {id:"unknown",title:"Not done",type:"RESOURCE",progress:{completedAt:null}},
    ],assignments:[{id:"b",title:"Essay",submittedAt:new Date("2026-10-13T10:00:00Z")}]}],now);
    expect(result.map(x=>x.label)).toEqual(["Content completed","Assignment submitted"]);
    expect(result.map(x=>x.id)).toEqual(["a","b"]);
    expect(result[0]?.filter).toBe("lectures");
  });
  it("does not manufacture updates for an empty workspace",()=>{
    expect(learnerRecentCourseActivity([],now)).toEqual([]);
  });
});
