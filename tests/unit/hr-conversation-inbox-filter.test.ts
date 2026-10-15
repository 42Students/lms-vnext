import {expect,it} from "vitest";
import {filterRecruiterConversations,hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
it("does not return threads linked to inaccessible employer drives",()=>{
 const threads=[{id:"general",jobId:null},{id:"own",jobId:"own-job"},{id:"other",jobId:"foreign-job"}];
 expect(filterRecruiterConversations(threads,new Set(["own-job"]),"").map(t=>t.id)).toEqual(["general","own"]);
 expect(hrConversationQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
});
it("supports searching an authorized role title but not a foreign role",()=>{
 const threads=[{id:"own",jobId:"own-job"},{id:"other",jobId:"other-job"}];
 expect(filterRecruiterConversations(threads,new Set(["own-job"]),"analyst",new Map([["own-job","Data Analyst"],["other-job","Data Analyst"]])))
  .toEqual([{id:"own",jobId:"own-job"}]);
});
