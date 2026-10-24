import {describe,expect,it} from "vitest";
import {mentorActivityCategoryChoices,mentorActivityGroup} from
 "@/modules/projects/mentor-activity-category-model";
describe("Mentor Activity prototype seven category controls",()=>{
 it("has seven distinct user-facing prototype groups",()=>{
  expect(mentorActivityCategoryChoices.map(row=>row.label)).toEqual([
   "Everything","Tasks","Sprints","Team & meetings",
   "Resources","Submission","Project details",
  ]);
 });
 it("classifies lifecycle, task, people, resources and delivery event families",()=>{
  const events:[string,string][]=[
   ["projects.task.status_changed","TASK"],["projects.task_comment.posted","TASK"],
   ["projects.sprint.updated","SPRINT"],["projects.release.shipped","SPRINT"],
   ["projects.team_member.added","TEAM"],["projects.meeting.decided","TEAM"],
   ["projects.resource.created","RESOURCE"],["projects.resource_file.attached","RESOURCE"],
   ["projects.delivery.submitted","SUBMISSION"],
   ["projects.project.completed","PROJECT"],["projects.readiness.overridden","PROJECT"],
   ["projects.mentor_update.posted","PROJECT"],
  ];
  for(const [kind,expected] of events)expect(mentorActivityGroup(kind)).toBe(expected);
 });
 it("does not pretend an unknown event belongs in a named category",()=>{
  expect(mentorActivityGroup("projects.unknown.imported")).toBe("OTHER");
  expect(mentorActivityGroup("identity.membership.ended")).toBe("OTHER");
 });
});
