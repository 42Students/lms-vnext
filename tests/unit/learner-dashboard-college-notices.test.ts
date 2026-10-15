import {it,expect} from "vitest";
import {learnerRecentCollegeNoticePreview as f} from "@/modules/placements/learner-dashboard-college-notices-model";
it("previews only the three authorized input notices, pinned first",()=>{
 const rows=[{id:"a",title:"New",isPinned:false,createdAt:"2026-10-14T00:00:00Z"},{id:"b",title:"Pinned",isPinned:true,createdAt:"2026-10-12T00:00:00Z"},{id:"c",title:"Old",isPinned:false,createdAt:"2026-10-10T00:00:00Z"},{id:"d",title:"Older",isPinned:false,createdAt:"2026-10-09T00:00:00Z"}];
 expect(f(rows).map(x=>x.id)).toEqual(["b","a","c"]);
 expect(rows[0].id).toBe("a");
});
