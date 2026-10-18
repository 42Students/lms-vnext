import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const state=vi.hoisted(()=>({context:vi.fn(),reader:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/modules/courses/super-admin-student-course-progress",()=>({
 getSuperAdminStudentCourseProgress:state.reader,
}));
import {GET} from "@/app/api/admin/course-progress/students/export/route";

const id="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"acting-super-admin"},adminScope:{collegeId:"22222222-2222-4222-8222-222222222222"}};
beforeEach(()=>{
 state.context.mockReset().mockResolvedValue(actor);
 state.reader.mockReset().mockResolvedValue({offeringId:id,rows:[],
  truncated:false});
});
describe("SA-academics-people-67 course-progress students export boundary",()=>{
 it("rejects ambiguous duplicate offeringId and foreign query keys before checking any membership or reading data",async()=>{
  for(const query of [
   "","?offeringId="+id+"&offeringId="+id,
   "?offeringId="+id+"&collegeId=another",
   "?collegeId=another",
  ]){
   const response=await GET(new Request("https://app.invalid/api/admin/course-progress/students/export"+query));
   expect(response.status).toBe(400);
   expect(state.context).not.toHaveBeenCalled();
   expect(state.reader).not.toHaveBeenCalled();
  }
 });
 it("passes only one requested offering ID with the live Super Admin scope, and escapes formula-like learner names",async()=>{
  state.reader.mockResolvedValueOnce({offeringId:id,truncated:false,rows:[
   {membershipId:"member",studentName:"=SUM(1,1)",videos:1,assignments:0,quizzes:0,
    totalVideos:2,totalAssignments:0,totalQuizzes:0},
  ]});
  const response=await GET(new Request("https://app.invalid/api/admin/course-progress/students/export?offeringId="+id));
  expect(response.status).toBe(200);
  expect(state.reader).toHaveBeenCalledWith(actor,{offeringId:id});
  const csv=await response.text();
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain("'=SUM(1,1)");
  expect(csv).toContain("50");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
 });
 it("keeps the student browser page from arbitrarily selecting the first duplicated URL parameter",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/course-progress/students/page.tsx","utf8");
  expect(page).toContain('typeof query.offeringId==="string"?query.offeringId:null');
  expect(page).not.toContain('query.offeringId[0]');
  expect(page).toContain("Unable to read course progress");
 });
});
