import {describe,it,expect} from "vitest";
import {learnerProjectTaskReviewNotice} from "@/modules/projects/learner-project-review-notification-model";
describe("LEARNER-projects-25 learner project review notifications",()=>{
 it("builds learner-owned route without exposing feedback in notification",()=>{
  const n=learnerProjectTaskReviewNotice({projectId:"project",taskId:"task",decision:"CHANGES_REQUESTED"});
  expect(n).toMatchObject({title:"Changes requested on your task",
    actionHref:"/learn/projects/project?tab=board&taskId=task"});
  expect(n.body).not.toContain("private reviewer");
 });
 it("uses approved notification only for actual approval",()=>{
  expect(learnerProjectTaskReviewNotice({projectId:"p",taskId:"t",decision:"APPROVED"}).title).toBe("Task approved");
  expect(learnerProjectTaskReviewNotice({projectId:"p",taskId:"t",decision:"REJECTED"}).title).toBe("Changes requested on your task");
 });
});
