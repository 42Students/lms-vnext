import {expect,it} from "vitest";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("retries the same scoped alert query rather than discarding active filters",()=>{
 const link=learnerNoticeFilterHref({pinned:true,unread:true,recent:false,q:"training",sort:"oldest"});
 const p=new URL(link,"https://example.test").searchParams;
 expect(p.get("q")).toBe("training");
 expect(p.get("unread")).toBe("1");
 expect(p.get("pinned")).toBe("1");
 expect(p.get("sort")).toBe("oldest");
});
