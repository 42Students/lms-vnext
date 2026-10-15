import {expect,it} from "vitest";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("clears only personal preview search while preserving the college notice search and author filter",()=>{
 const href=learnerNoticeFilterHref({pinned:true,unread:true,recent:true,q:"campus",alertQ:"",sort:"oldest",source:"placement-cell"});
 const q=new URL(href,"https://example.test").searchParams;
 expect(q.has("alertQ")).toBe(false);expect(q.get("q")).toBe("campus");
 expect(q.get("source")).toBe("placement-cell");expect(q.get("unread")).toBe("1");
 expect(q.get("sort")).toBe("oldest");
});
