import {expect,it} from "vitest";
import {mentorActivityQuerySchema as schema,mentorPortfolioHref as href} from "@/modules/projects/mentor-portfolio-model";
import {mentorProjectActivityQuerySchema,mentorProjectActivityEventTypes} from "@/modules/projects/mentor-project-activity-model";
it("makes registered Mentor reassignment events reviewable without leaking private member history",()=>{
 const q=schema.parse({view:"ASSIGNMENTS",page:2});
 expect(q.view).toBe("ASSIGNMENTS");
 expect(mentorProjectActivityEventTypes("ASSIGNMENTS")).toEqual(["projects.mentor.reassigned"]);
 expect(mentorProjectActivityQuerySchema.parse({projectId:"10000000-0000-4000-8000-000000000001",view:"ASSIGNMENTS"}).view).toBe("ASSIGNMENTS");
 expect(href("activity",q)).toContain("view=ASSIGNMENTS");
 expect(schema.safeParse({view:"MEMBER_EMAIL"}).success).toBe(false);
});
