
import {expect,it} from "vitest";
import {mentorProjectActivityEventTypes,mentorProjectActivityQuerySchema,mentorProjectActivityHref}
 from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("groups registered delivery draft, submission and review events into the Mentor timeline",()=>{
 const types=mentorProjectActivityEventTypes("DELIVERIES");
 expect(types).toEqual(["projects.delivery.draft_created","projects.delivery.draft_updated",
 "projects.delivery.submitted","projects.delivery.reviewed"]);
 const query=mentorProjectActivityQuerySchema.parse({projectId,view:"DELIVERIES"});
 expect(mentorProjectActivityHref(query)).toContain("view=DELIVERIES");
});
