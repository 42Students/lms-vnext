import {expect,it} from "vitest";
import {learnerNoticeQuerySchema} from "@/modules/placements/learner-notices-query-model";
import {learnerNoticeSortSchema} from "@/modules/placements/learner-notices-sort-model";
it("rejects malformed notice query values instead of treating them as real filters",()=>{
 expect(learnerNoticeQuerySchema.safeParse({pinned:["1","0"]}).success).toBe(false);
 expect(learnerNoticeQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
 expect(learnerNoticeQuerySchema.safeParse({page:"0"}).success).toBe(false);
 expect(learnerNoticeSortSchema.safeParse(["latest","oldest"]).success).toBe(false);
 expect(learnerNoticeQuerySchema.safeParse({pinned:"1",page:"2",sort:"latest"}).success).toBe(true);
});
