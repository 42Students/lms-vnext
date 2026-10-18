import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({
 workspace:vi.fn(),threads:vi.fn(),
}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({
 getRecruiterPlacementWorkspace:mocks.workspace,
}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 listMessageThreads:mocks.threads,
}));
import {getRecruiterDriveConversations}
 from "@/modules/placements/hr-drive-conversation-service";
import {recruiterDriveThreads} from "@/modules/placements/hr-drive-conversation-model";

const job="123e4567-e89b-42d3-a456-426614174001";
const otherJob="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter-a"}};
const workspace={job:{id:job},college:{id:"college-a"}};
const threads=[
 {id:"good",collegeId:"college-a",jobId:job,recruiterUserId:"recruiter-a"},
 {id:"other-recruiter",collegeId:"college-a",jobId:job,recruiterUserId:"recruiter-b"},
 {id:"other-job",collegeId:"college-a",jobId:otherJob,recruiterUserId:"recruiter-a"},
 {id:"unscoped",collegeId:"college-a",jobId:null,recruiterUserId:"recruiter-a"},
 {id:"foreign-college",collegeId:"college-b",jobId:job,recruiterUserId:"recruiter-a"},
];

describe("HR-BREAK-messaging-01: drive conversations, IDOR and expired-session journeys",()=>{
 beforeEach(()=>{vi.clearAllMocks();});
 it("fetches only after authorized workspace lookup, then filters by job and recruiter",async()=>{
  mocks.workspace.mockResolvedValue(workspace);
  mocks.threads.mockResolvedValue(threads);
  const result=await getRecruiterDriveConversations(actor as never,job);
  expect(mocks.workspace).toHaveBeenCalledTimes(1);
  expect(mocks.workspace).toHaveBeenCalledWith(actor,job);
  expect(mocks.threads).toHaveBeenCalledTimes(1);
  expect(mocks.threads).toHaveBeenCalledWith(actor,"college-a");
  expect(result.threads).toEqual([threads[0]]);
  expect(result.workspace).toBe(workspace);
 });
 it("wrong-tenant or inactive recruiter workspace rejection cannot list messages",async()=>{
  mocks.workspace.mockRejectedValue(new Error("NOT_FOUND"));
  await expect(getRecruiterDriveConversations(actor as never,otherJob)).rejects.toThrow("NOT_FOUND");
  expect(mocks.threads).not.toHaveBeenCalled();
 });
 it("malformed object IDs fail validation before any database or message request",async()=>{
  for(const invalid of ["../another-job","",null,{},42]){
   await expect(getRecruiterDriveConversations(actor as never,invalid)).rejects.toThrow();
  }
  expect(mocks.workspace).not.toHaveBeenCalled();
  expect(mocks.threads).not.toHaveBeenCalled();
 });
 it("never leaks another relationship's conversation because the ID happens to match a job",()=>{
  const source=threads.slice();
  expect(recruiterDriveThreads(source,job,"recruiter-a")).toEqual([threads[0]]);
  expect(recruiterDriveThreads(source,job,"recruiter-b")).toEqual([threads[1]]);
  expect(recruiterDriveThreads(source,"unrelated","recruiter-a")).toEqual([]);
  expect(source).toEqual(threads);
 });
});