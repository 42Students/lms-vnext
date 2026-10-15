import {expect,it} from "vitest";
import {mentorActivityQuerySchema,mentorPortfolioHref} from "@/modules/projects/mentor-portfolio-model";
it("limits older-than-30-day portfolio activity to its strict, preserved selector",()=>{
 const q=mentorActivityQuerySchema.parse({window:"OLDER_THAN_30_DAYS",page:2});
 expect(q.window).toBe("OLDER_THAN_30_DAYS");
 expect(mentorPortfolioHref("activity",q)).toContain("window=OLDER_THAN_30_DAYS");
 expect(mentorActivityQuerySchema.safeParse({window:"BEFORE_TIME"}).success).toBe(false);
});
