import {expect,it} from "vitest";
import {hrTodayConversationSignals} from "@/modules/placements/hr-today-conversation-model";
it("never counts an outbound recruiter reply as an incoming unread message",()=>{
 const signals=hrTodayConversationSignals([
  {id:"x",jobTitle:"Role",unread:0,lastMessageAt:new Date(),
   preview:{senderType:"RECRUITER",text:"Sent by employer"}},
 ],1);
 expect(signals.unreadInPage).toBe(0);
 expect(signals.waiting.length).toBe(1);
});
