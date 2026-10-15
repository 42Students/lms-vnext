import {expect,it} from "vitest";
import {mentorActivityQuerySchema as portfolio,mentorPortfolioHref as href} from "@/modules/projects/mentor-portfolio-model";
import {mentorProjectActivityQuerySchema as exact,mentorProjectActivityEventTypes as allowed} from "@/modules/projects/mentor-project-activity-model";
it("scopes sprint changes to the registered event taxonomy without revealing raw audit metadata",()=>{
 const q=portfolio.parse({view:"SPRINTS",page:2});
 expect(q.view).toBe("SPRINTS");
 expect(exact.parse({projectId:"10000000-0000-4000-8000-000000000001",view:"SPRINTS"}).view).toBe("SPRINTS");
 expect(allowed("SPRINTS")).toEqual(["projects.sprint.updated"]);
 expect(href("activity",q)).toContain("view=SPRINTS");
 expect(portfolio.safeParse({view:"UNAUTHORIZED"}).success).toBe(false);
});
