import {expect,it} from "vitest";
import {hrConversationDetailHref} from "@/modules/placements/hr-conversation-detail-links-model";
it("returns an exact authorized thread path without arbitrary appended segments",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(hrConversationDetailHref(id,1)).toBe("/hr/conversations/"+id+"?page=1");
 expect(()=>hrConversationDetailHref("../private",1)).toThrow();
 expect(()=>hrConversationDetailHref(id,0)).toThrow();
});
