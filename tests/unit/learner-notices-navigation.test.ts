import {it,expect} from "vitest";
import {learnerNoticeFilterHref as href} from "@/modules/placements/learner-notices-navigation-model";
it("preserves independent notice filters while resetting stale pages",()=>{
 const url=href({pinned:true,unread:true,recent:true,q:"Drive & update"});
 const params=new URL(url,"https://example.com").searchParams;
 expect(params.get("pinned")).toBe("1");expect(params.get("unread")).toBe("1");
 expect(params.get("recent")).toBe("1");expect(params.get("q")).toBe("Drive & update");
 expect(params.has("page")).toBe(false);
});
