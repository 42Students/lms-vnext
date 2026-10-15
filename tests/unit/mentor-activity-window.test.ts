import {describe,it,expect} from "vitest";
import {mentorActivityQuerySchema,mentorPortfolioHref} from "@/modules/projects/mentor-portfolio-model";
describe("Mentor activity recent window",()=>{
  it("accepts strict 7-day recorded event window",()=>expect(mentorActivityQuerySchema.parse({window:"PAST_7_DAYS"}).window).toBe("PAST_7_DAYS"));
  it("rejects arbitrary custom periods",()=>expect(mentorActivityQuerySchema.safeParse({window:"NEXT_MONTH"}).success).toBe(false));
  it("retains the window on paginated links",()=>expect(mentorPortfolioHref("activity",{window:"PAST_7_DAYS",page:2})).toContain("window=PAST_7_DAYS"));
});
