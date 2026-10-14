import {describe,expect,it} from "vitest";
import {learnerNotificationProjectAction} from "@/modules/activity/learner-notification-project-action-model";
const id="81818181-8181-4818-8818-818181818181";
describe("notification project action canonicalization",()=>{
 it("keeps only the project and recognized tab",()=>{
  expect(learnerNotificationProjectAction("/learn/projects/"+id+"?tab=activity&userId=other"))
   .toEqual({href:"/learn/projects/"+id+"?tab=activity",label:"View project"});
  expect(learnerNotificationProjectAction("/learn/projects")).toEqual({href:"/learn/projects",label:"View projects"});
 });
 it("rejects duplicate/forged tabs, cross-role and external URLs",()=>{
  for(const raw of ["/learn/projects/"+id+"?tab=board&tab=delivery","/learn/projects/bad",
   "/learn/projects/"+id+"/private","/tpo/projects/"+id,"//evil.test"])
   expect(learnerNotificationProjectAction(raw)).toBeNull();
 });
});
