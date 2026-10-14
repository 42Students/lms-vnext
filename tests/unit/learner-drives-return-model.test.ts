import {describe,expect,it} from "vitest";
import {learnerJobDetailFromDrivesHref,learnerJobReturnToDrivesHref}
 from "@/modules/placements/learner-drives-return-model";
const id="81818181-8181-4818-8818-818181818181";
describe("job detail return to filtered Drives",()=>{
  it("preserves exact authorized search, page and sorting without client identity",()=>{
    const detail=learnerJobDetailFromDrivesHref(id,"q=engineer&sort=newest&page=2")!;
    expect(detail).toContain("/jobs/"+id+"?back=");
    const back=new URL(detail,"https://lms.invalid").searchParams.get("back");
    expect(learnerJobReturnToDrivesHref(back))
      .toBe("/learn/my-placements/jobs?q=engineer&sort=newest&page=2");
  });
  it("drops unknown college/actor and malformed filter selectors",()=>{
    expect(learnerJobReturnToDrivesHref("collegeId=other")).toBe("/learn/my-placements/jobs");
    expect(learnerJobDetailFromDrivesHref(id,"userId=spoofed")).toBe("/learn/my-placements/jobs/"+id);
    expect(learnerJobDetailFromDrivesHref("not-uuid","q=ok")).toBeNull();
  });
});
