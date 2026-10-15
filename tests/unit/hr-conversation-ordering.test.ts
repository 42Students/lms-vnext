import {expect,it} from "vitest";
import {orderRecruiterConversations,hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
const timestamp=(n:number)=>new Date(1760520000000+n*1000);
it("sorts newer/older from persisted message or creation time with deterministic ID ties",()=>{
 const rows=[
  {id:"b",createdAt:timestamp(1),lastMessageAt:null},
  {id:"a",createdAt:timestamp(2),lastMessageAt:timestamp(4)},
  {id:"c",createdAt:timestamp(4),lastMessageAt:null},
 ];
 expect(orderRecruiterConversations(rows,"LATEST").map(x=>x.id)).toEqual(["a","c","b"]);
 expect(orderRecruiterConversations(rows,"OLDEST").map(x=>x.id)).toEqual(["b","a","c"]);
 expect(hrConversationQuerySchema.safeParse({sort:"BOGUS"}).success).toBe(false);
});
