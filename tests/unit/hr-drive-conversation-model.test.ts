import {it,expect} from "vitest";
import {recruiterDriveThreads} from "@/modules/placements/hr-drive-conversation-model";
it("separates job-specific conversation threads from general and other-job messages",()=>{
 const threads=[{jobId:null,id:"general"},{jobId:"a",id:"a"},{jobId:"b",id:"b"}];
 expect(recruiterDriveThreads(threads,"a")).toEqual([{jobId:"a",id:"a"}]);
});
