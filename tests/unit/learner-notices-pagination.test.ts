import {it,expect} from "vitest";
import {learnerNoticeQuerySchema} from "@/modules/placements/learner-notices-query-model";
import {paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
it("bounds notice URL pages and keeps the already scoped list intact",()=>{
 expect(learnerNoticeQuerySchema.safeParse({page:"10000"}).success).toBe(false);
 const rows=Array.from({length:16},(_,i)=>i);
 const page=paginateOwnOffers(rows,2,15);
 expect(page.items).toEqual([15]);
 expect(rows.length).toBe(16);
});
