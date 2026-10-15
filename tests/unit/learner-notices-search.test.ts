import {it,expect} from "vitest";
import {searchLearnerNotices as f} from "@/modules/placements/learner-notices-search-model";
it("matches authorized notice title/body without mutating source",()=>{
 const rows=[{title:"Campus drive",message:"Tomorrow"},{title:"General",message:"Scholarships"}];
 expect(f(rows,"dRivE")).toEqual([rows[0]]);
 expect(f(rows,"nothing")).toEqual([]);
 expect(rows).toHaveLength(2);
});
