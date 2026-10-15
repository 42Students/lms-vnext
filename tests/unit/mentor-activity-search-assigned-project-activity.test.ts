import {expect,it} from "vitest";
import {mentorActivityQuerySchema as schema,mentorActivityProjectTitleMatch as match,mentorPortfolioHref as href} from "@/modules/projects/mentor-portfolio-model";
it("searches only authorized project-title strings and preserves navigation",()=>{
 expect(match("Project Apollo","  APOLLO ")).toBe(true);
 expect(match("Orion","Apollo")).toBe(false);
 expect(schema.safeParse({search:"x".repeat(121)}).success).toBe(false);
 expect(schema.safeParse({search:"ok",collegeId:"forged"}).success).toBe(false);
 expect(href("activity",schema.parse({search:"Project Apollo",page:2}))).toContain("search=Project+Apollo");
});
