import {expect,it} from "vitest";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("clears only text query when retaining a pinned unread recent chronological selection",()=>{
 const url=new URL(learnerNoticeFilterHref({pinned:true,unread:true,recent:true,q:"",sort:"latest"}),"https://example.test");
 expect(url.searchParams.has("q")).toBe(false);
 expect(url.searchParams.get("pinned")).toBe("1");
 expect(url.searchParams.get("unread")).toBe("1");
 expect(url.searchParams.get("recent")).toBe("1");
 expect(url.searchParams.get("sort")).toBe("latest");
});
