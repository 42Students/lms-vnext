import {expect,it} from "vitest";
import {mentorActivityQuerySchema as schema,mentorPortfolioHref} from "@/modules/projects/mentor-portfolio-model";
it("retains the rolling past-90-day portfolio window in activity navigation",()=>{
 const q=schema.parse({window:"PAST_90_DAYS",page:7});
 expect(q.window).toBe("PAST_90_DAYS");
 expect(mentorPortfolioHref("activity",q)).toContain("window=PAST_90_DAYS");
 expect(schema.safeParse({window:"PAST_365_DAYS"}).success).toBe(false);
});
