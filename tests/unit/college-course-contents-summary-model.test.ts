import {describe,expect,it} from "vitest";
import {summarizeCollegeCourseContents} from "@/modules/courses/college-course-contents-summary-model";
describe("College Admin in-this-course summary",()=>{
  it("counts persisted shared authored items, including YouTube as video",()=>{
    const rows=summarizeCollegeCourseContents([{
      contents:[{contentType:"YOUTUBE" as const},{contentType:"VIDEO" as const},
        {contentType:"RESOURCE" as const},{contentType:"LIVE_CLASS" as const}],
      assignments:[{}],quizzes:[{},{}],
    }]);
    expect(rows.map(row=>[row.key,row.count])).toEqual([
      ["lessons",1],["videos",2],["resources",1],["liveClasses",1],["assignments",1],["quizzes",2],
    ]);
  });
  it("returns real zero counts for an actual empty learning path",()=>{
    expect(summarizeCollegeCourseContents([]).every(row=>row.count===0)).toBe(true);
  });
});
