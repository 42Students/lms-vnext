import {expect,it} from "vitest";
import {hrConversationQuerySchema,scopeRecruiterConversations} from "@/modules/placements/hr-conversation-inbox-model";
it("separates employer drive and general conversations after ownership checks",()=>{
 const items=[{id:"general",jobId:null},{id:"job",jobId:"job-id"}];
 expect(scopeRecruiterConversations(items,"GENERAL").map(x=>x.id)).toEqual(["general"]);
 expect(scopeRecruiterConversations(items,"DRIVE").map(x=>x.id)).toEqual(["job"]);
 expect(scopeRecruiterConversations(items,"ALL")).toHaveLength(2);
 expect(hrConversationQuerySchema.safeParse({scope:"FOREIGN"}).success).toBe(false);
});
