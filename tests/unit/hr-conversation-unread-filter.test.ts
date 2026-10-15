import {expect,it} from "vitest";
import {hrConversationQuerySchema,onlyUnreadRecruiterThreads} from "@/modules/placements/hr-conversation-inbox-model";
it("filters only authorized threads with incoming unread records before pagination",()=>{
 const source=[{id:"my-a"},{id:"my-b"}];
 const result=onlyUnreadRecruiterThreads(source,new Set(["my-b","not-authorized"]),true);
 expect(result.map(row=>row.id)).toEqual(["my-b"]);
 expect(hrConversationQuerySchema.safeParse({unreadOnly:"true"}).success).toBe(true);
 expect(hrConversationQuerySchema.safeParse({unreadOnly:"yes"}).success).toBe(false);
});
