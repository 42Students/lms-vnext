import {it,expect} from "vitest";
import {filterLearnerRecentNotices as f} from "@/modules/placements/learner-notices-recent-model";
it("rejects future and expired notices for the recent view",()=>{
 const now=Date.parse("2026-10-15T00:00:00Z");
 const rows=[{createdAt:"2026-10-14T00:00:00Z"},{createdAt:"2026-08-01T00:00:00Z"},{createdAt:"2027-01-01T00:00:00Z"}];
 expect(f(rows,now)).toEqual([rows[0]]);
});
