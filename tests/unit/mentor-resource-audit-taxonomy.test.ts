import {expect,it} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {mentorProjectActivityEventTypes as types} from "@/modules/projects/mentor-project-activity-model";
import {mentorActivityQuerySchema,safeMentorProjectEventLabel as label} from "@/modules/projects/mentor-portfolio-model";
it("registers Project resource lifecycle events and safely displays them in Mentor source filters",()=>{
 const allowed=types("RESOURCES");
 expect(allowed).toEqual([
  ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_CREATED,
  ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED,
  ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED,
 ]);
 expect(mentorActivityQuerySchema.parse({view:"RESOURCES"}).view).toBe("RESOURCES");
 expect(label(ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED)).toBe("Project resource archived");
 expect(label("sensitive:unknown")).toBe("Project activity recorded");
});
