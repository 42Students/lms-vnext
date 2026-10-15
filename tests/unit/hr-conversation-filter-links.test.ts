import {expect,it} from "vitest";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
it("preserves the college, unread state and literal search through page navigation",()=>{
 const uri=hrConversationsHref({collegeId:"college",q:"sales + hr",unreadOnly:"true",page:2});
 const parsed=new URL(uri,"https://example.test");
 expect(parsed.searchParams.get("q")).toBe("sales + hr");
 expect(parsed.searchParams.get("unreadOnly")).toBe("true");
 expect(parsed.searchParams.get("page")).toBe("2");
});
