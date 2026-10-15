import {expect,it} from "vitest";
import {mentorReviewHistoryQuerySchema as schema,mentorReviewHistoryHref as href} from "@/modules/projects/mentor-review-history-model";
it("preserves registered Project lifecycle in scoped delivery history",()=>{
 const query=schema.parse({projectState:"ARCHIVED",page:2});
 expect(query.projectState).toBe("ARCHIVED");
 expect(href(query)).toContain("projectState=ARCHIVED");
 expect(schema.safeParse({projectState:"UNKNOWN"}).success).toBe(false);
 expect(schema.safeParse({collegeId:"foreign"}).success).toBe(false);
});
