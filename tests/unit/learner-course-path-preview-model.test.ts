import {describe,expect,it} from "vitest";
import {learnerCoursePathPreview} from "@/modules/courses/learner-course-path-preview-model";
describe("learner Course Home persisted path preview",()=>{
  it("sorts persisted lessons, measures only real items, never invents outcomes",()=>{
    const preview=learnerCoursePathPreview([
      {id:"b",name:"Second",sequence:2,items:[{progress:{status:"NOT_STARTED"}}]},
      {id:"a",name:"First",sequence:1,items:[{progress:{status:"COMPLETED"}},{progress:{status:"NOT_STARTED"}}]},
      {id:"c",name:"No published items",sequence:3,items:[]},
    ],2);
    expect(preview).toEqual({lessons:[
      {id:"a",name:"First",total:2,completed:1,progress:50},
      {id:"b",name:"Second",total:1,completed:0,progress:0},
    ],totalLessons:3,remaining:1});
    expect(learnerCoursePathPreview([{id:"c",name:"Empty",sequence:0,items:[]}]).lessons[0]?.progress).toBeNull();
  });
  it("keeps an unpublished/empty learning path genuinely empty",()=>{
    expect(learnerCoursePathPreview([])).toEqual({lessons:[],remaining:0,totalLessons:0});
  });
});
