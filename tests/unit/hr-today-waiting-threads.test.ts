import {expect,it} from "vitest";
import {hrTodayConversationSignals} from "@/modules/placements/hr-today-conversation-model";
it("does not claim a reply is pending merely because a thread exists",()=>{
 const x=hrTodayConversationSignals([
 {id:"a",jobTitle:"Role",unread:0,lastMessageAt:null,preview:null},
 {id:"b",jobTitle:"Role 2",unread:0,lastMessageAt:new Date(),preview:{senderType:"TPO",text:"Hello"}},
 ],2);
 expect(x.waiting).toEqual([]);
});
