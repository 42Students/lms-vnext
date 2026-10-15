import {expect,it} from "vitest";
import {mentorPortfolioActivityCutoff} from "@/modules/projects/mentor-portfolio-model";
it("uses a single absolute cutoff for a filter-scoped Mentor activity export",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 expect(mentorPortfolioActivityCutoff("ALL",now)).toBeNull();
 expect(mentorPortfolioActivityCutoff("PAST_7_DAYS",now)?.toISOString()).toBe("2026-10-08T00:00:00.000Z");
 expect(mentorPortfolioActivityCutoff("PAST_90_DAYS",now)?.getTime()).toBe(now.getTime()-90*86400000);
 expect(mentorPortfolioActivityCutoff("OLDER_THAN_30_DAYS",now)).toEqual(mentorPortfolioActivityCutoff("PAST_30_DAYS",now));
});
