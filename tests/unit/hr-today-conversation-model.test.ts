import {expect,it} from "vitest";
import {hrTodayConversationSignals} from "@/modules/placements/hr-today-conversation-model";
it("separates actual unread placement-cell replies from recruiter-last-sent threads",()=>{
 const items=[
  {id:"a",jobTitle:"Analyst",unread:2,lastMessageAt:new Date("2026-10-14"),
   preview:{senderType:"TPO",text:"Private text"}},
  {id:"b",jobTitle:"Designer",unread:0,lastMessageAt:new Date("2026-10-14"),
   preview:{senderType:"RECRUITER",text:"Private text"}},
  {id:"c",jobTitle:"Empty",unread:0,lastMessageAt:null,preview:null},
 ];
 const result=hrTodayConversationSignals(items,4);
 expect(result.unread.map(row=>row.id)).toEqual(["a"]);
 expect(result.waiting.map(row=>row.id)).toEqual(["b"]);
 expect(result.limitedToCurrentPage).toBe(true);
 expect(JSON.stringify(result)).not.toContain("Private text");
});
