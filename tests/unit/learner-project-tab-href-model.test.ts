import {describe,expect,it} from "vitest";
import {learnerProjectTabHref} from "@/modules/projects/learner-project-tab-href-model";
const id="11111111-1111-4111-8111-111111111111";
describe("learner Project tab transitions",()=>{
  it("keeps validated filters but not transient modal/older-page cursor",()=>{
    const query=new URLSearchParams({
      tab:"board",taskStatus:"BLOCKED",taskSearch:"review",taskId:id,
      activityCategory:"TASKS",activityBeforeTime:"2026-10-15",
    });
    const link=learnerProjectTabHref(id,"team",query);
    expect(link).toContain("taskStatus=BLOCKED");
    expect(link).toContain("taskSearch=review");
    expect(link).not.toContain("taskId=");
    expect(link).not.toContain("activityBeforeTime=");
    const reopened=learnerProjectTabHref(id,"board",new URLSearchParams(link.split("?")[1]));
    expect(reopened).toContain("taskStatus=BLOCKED");
  });
  it("rejects oversized URL filter values",()=>{
    const href=learnerProjectTabHref(id,"board",new URLSearchParams({taskSearch:"x".repeat(101)}));
    expect(href).not.toContain("taskSearch=");
  });
});
