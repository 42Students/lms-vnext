import {expect,it} from "vitest";
import {filterRecruiterConversations,hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
it("does not return threads linked to inaccessible employer drives",()=>{
 const threads=[{id:"general",jobId:null},{id:"own",jobId:"own-job"},{id:"other",jobId:"foreign-job"}];
 expect(filterRecruiterConversations(threads,new Set(["own-job"]),"").map(t=>t.id)).toEqual(["general","own"]);
 expect(hrConversationQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
});
