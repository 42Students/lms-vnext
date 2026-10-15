import {it,expect} from "vitest";
import {recruiterDriveThreads} from "@/modules/placements/hr-drive-conversation-model";
it("filters drive threads by BOTH job and recruiter owner even for dual-role users",()=>{
 const threads=[
  {jobId:null,id:"general",recruiterUserId:"own"},
  {jobId:"a",id:"a",recruiterUserId:"own"},
  {jobId:"a",id:"foreign",recruiterUserId:"other"},
  {jobId:"b",id:"b",recruiterUserId:"own"},
 ];
 expect(recruiterDriveThreads(threads,"a","own").map(t=>t.id)).toEqual(["a"]);
});
