import {it,expect} from "vitest";
import {hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
it.each([1,"1",20,"20"])("accepts canonical recruiter conversation page %s",page=>{
 expect(hrConversationQuerySchema.safeParse({page}).success).toBe(true);
});
it.each([true,false,0,"0","01","1e2"," 2 ","2.0","-1",10001,Infinity])(
 "rejects ambiguous recruiter conversation page %s",page=>{
 expect(hrConversationQuerySchema.safeParse({page}).success).toBe(false);
});
