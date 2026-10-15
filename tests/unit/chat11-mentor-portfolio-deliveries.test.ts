
import {expect,it} from "vitest";
import {mentorActivityQuerySchema,mentorPortfolioHref} from "@/modules/projects/mentor-portfolio-model";
import {mentorProjectActivityEventTypes} from "@/modules/projects/mentor-project-activity-model";
it("keeps the delivery event group across assigned-project portfolio navigation",()=>{
 const q=mentorActivityQuerySchema.parse({view:"DELIVERIES",assignment:"PRIMARY"});
 expect(mentorProjectActivityEventTypes(q.view)).toContain("projects.delivery.submitted");
 expect(mentorPortfolioHref("activity",q)).toContain("view=DELIVERIES");
 expect(mentorPortfolioHref("activity",q)).toContain("assignment=PRIMARY");
});
