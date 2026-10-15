import {expect,it} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {mentorProjectActivityEventTypes as filter} from "@/modules/projects/mentor-project-activity-model";
import {mentorActivityQuerySchema,safeMentorProjectEventLabel as label} from "@/modules/projects/mentor-portfolio-model";
it("registers non-identifying Project team membership event labels in both Mentor timelines",()=>{
 expect(filter("TEAM")).toEqual([
  ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ADDED,
  ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_UPDATED,
  ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ENDED,
 ]);
 expect(mentorActivityQuerySchema.parse({view:"TEAM"}).view).toBe("TEAM");
 expect(label(ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ENDED)).toBe("Project team membership ended");
});
