import {expect,it} from "vitest";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
it("does not discard drive/general scope in unread tab and pagination URLs",()=>{
 const path=hrConversationsHref({collegeId:"c",q:"QA",scope:"DRIVE",sort:"OLDEST",unreadOnly:"true",page:2});
 const u=new URL(path,"https://example.test");
 expect(u.searchParams.get("scope")).toBe("DRIVE");
 expect(u.searchParams.get("unreadOnly")).toBe("true");
 expect(u.searchParams.get("sort")).toBe("OLDEST");
});
