import {expect,it} from "vitest";
import {mentorReviewHistoryQuerySchema as schema,mentorReviewHistoryHref as href} from "@/modules/projects/mentor-review-history-model";
it("preserves older recorded decisions selection across pagination",()=>{
 const query=schema.parse({window:"OLDER_THAN_30_DAYS",page:3});
 expect(query.window).toBe("OLDER_THAN_30_DAYS");
 expect(href(query)).toContain("window=OLDER_THAN_30_DAYS");
 expect(schema.safeParse({window:"OLDER_THAN_1_DAY"}).success).toBe(false);
});
