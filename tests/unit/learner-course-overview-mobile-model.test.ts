import {describe,expect,it} from "vitest";
import {learnerCourseOverviewJumps} from "@/modules/courses/learner-course-overview-mobile-model";
describe("responsive Course Overview in-page navigation",()=>{
  it("links only sections that are visible for an authorized workspace",()=>{
    expect(learnerCourseOverviewJumps({hasPublishedPath:true,hasUpdates:true})
      .map(x=>x.id)).toEqual([
        "course-overview-about","course-overview-path","course-overview-next",
        "course-overview-progress","course-overview-updates",
      ]);
  });
  it("does not link to absent learning path or updates",()=>{
    expect(learnerCourseOverviewJumps({hasPublishedPath:false,hasUpdates:false})
      .map(x=>x.label)).toEqual(["About","Next step","Progress"]);
  });
});
