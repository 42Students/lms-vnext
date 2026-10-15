import {it,expect} from "vitest";
import {learnerNoticeQuerySchema as schema} from "@/modules/placements/learner-notices-query-model";
it("rejects arrays and numeric-coercion aliases while keeping strict URL filters",()=>{
 expect(schema.parse({page:"19",pinned:"1"}).page).toBe(19);
 for(const x of [[],["1"],"0","01"," 1 ","1e3","10000",null,1])
   expect(schema.safeParse({page:x}).success).toBe(false);
 expect(schema.safeParse({collegeId:"foreign"}).success).toBe(false);
});
