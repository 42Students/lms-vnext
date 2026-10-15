import {expect,it} from "vitest";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
it("preserves authorized college, literal query, unread and sort in page navigation",()=>{
 const href=hrConversationsHref({collegeId:"college",q:"data + analyst",unreadOnly:"true",sort:"OLDEST",page:3});
 const params=new URL(href,"https://example.test").searchParams;
 expect(params.get("sort")).toBe("OLDEST");
 expect(params.get("q")).toBe("data + analyst");
 expect(params.get("page")).toBe("3");
 expect(params.get("unreadOnly")).toBe("true");
});
