import {expect,it} from "vitest";
import {learnerRecentCollegeNoticePreview} from "@/modules/placements/learner-dashboard-college-notices-model";
it("orders valid college notice timestamps ahead of invalid ones and uses a stable tie-break",()=>{
 const rows=[{id:"a",title:"A",isPinned:false,createdAt:"invalid"},
 {id:"c",title:"C",isPinned:false,createdAt:"2026-10-15T00:00:00Z"},
 {id:"b",title:"B",isPinned:false,createdAt:"invalid"}];
 expect(learnerRecentCollegeNoticePreview(rows).map(r=>r.id)).toEqual(["c","a","b"]);
 expect(rows[0].id).toBe("a");
});
