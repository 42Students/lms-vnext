import {expect,it} from "vitest";
import {hrTodayConversationSignals} from "@/modules/placements/hr-today-conversation-model";
it("limits Today private unread links to three actual incoming-message threads",()=>{
 const items=Array.from({length:5},(_,i)=>({id:String(i),jobTitle:"Role "+i,
  unread:1,lastMessageAt:new Date(),preview:{senderType:"TPO",text:"Private"}}));
 const result=hrTodayConversationSignals(items,5);
 expect(result.unread.length).toBe(3);
 expect(result.unread[0]?.href).toBe("/hr/conversations/0");
 expect(JSON.stringify(result.unread)).not.toContain("Private");
});
