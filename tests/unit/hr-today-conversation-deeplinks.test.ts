import {expect,it} from "vitest";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
it("Today unread action opens the first filtered page for the exact college",()=>{
 const path=hrConversationsHref({collegeId:"c",q:"",unreadOnly:"true",page:1});
 const u=new URL(path,"https://example.test");
 expect(u.searchParams.get("collegeId")).toBe("c");
 expect(u.searchParams.get("unreadOnly")).toBe("true");
});
