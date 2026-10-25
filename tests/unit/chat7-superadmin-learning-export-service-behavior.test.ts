import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({context:{
 user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"acting-super-admin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
 adminScope:{collegeId:"22222222-2222-4222-8222-222222222222",
  organizationId:"33333333-3333-4333-8333-333333333333"},
},reader:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:()=>state.context}));
vi.mock("@/modules/courses/college-assessment-aggregate-service",()=>({
 listCollegeAssessmentAggregate:(context:unknown,kind:unknown,query:unknown)=>state.reader(context,kind,query),
}));
import {exportSuperAdminLearningDirectory} from "@/modules/admin-ui/super-admin-learning-csv-service";

const row=(i:number)=>({
 id:"assessment-"+i,title:i===0?"=1+1":"Unit "+i,courseName:"Algorithms",
 courseCode:"CS401",lessonName:"Graphs",status:"PUBLISHED",dueAt:null,points:10,
 activityCount:2,eligibleLearners:3,submittedLearners:1,gradedLearners:0,
 resultsPublished:false,
});
beforeEach(()=>state.reader.mockReset());
describe("Super Admin assessment export service scoped pagination",()=>{
 it("SA-academics-people-64/65 rejects duplicate, foreign-tenant, invalid status and assignment-only result filters before reading",async()=>{
  for(const [kind,url] of [
   ["ASSIGNMENT","https://app.invalid/api/admin/assignments/export?status=PUBLISHED&status=ARCHIVED"],
   ["ASSIGNMENT","https://app.invalid/api/admin/assignments/export?collegeId=another"],
   ["ASSIGNMENT","https://app.invalid/api/admin/assignments/export?status=CLOSED"],
   ["ASSIGNMENT","https://app.invalid/api/admin/assignments/export?results=PUBLISHED"],
   ["QUIZ","https://app.invalid/api/admin/quizzes/export?scope=INVALID"],
   ["QUIZ","https://app.invalid/api/admin/quizzes/export?results=HIDDEN&results=ALL"],
  ] as const){
   const response=await exportSuperAdminLearningDirectory(new Request(url),kind);
   expect(response.status).toBe(400);
  }
  expect(state.reader).not.toHaveBeenCalled();
 });
 it("SA-academics-people-64 passes the acting session and selected assignment filters to the authorized reader",async()=>{
  state.reader.mockResolvedValue({items:[row(0)],total:1,totalPages:1});
  const request=new Request("https://app.invalid/api/admin/assignments/export?q=Graphs&status=PUBLISHED&courseCode=CS401&scope=SECTION");
  const response=await exportSuperAdminLearningDirectory(request,"ASSIGNMENT",state.reader);
  expect(response.status).toBe(200);
  expect(state.reader).toHaveBeenCalledTimes(1);
  const [context,kind,query]=state.reader.mock.calls[0];
  expect(context).toBe(state.context);
  expect(kind).toBe("ASSIGNMENT");
  expect(query).toMatchObject({q:"Graphs",status:"PUBLISHED",courseCode:"CS401",scope:"SECTION",page:1});
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  // Response.text() strips the UTF-8 BOM during decoding; inspect the
  // exported bytes so the BOM contract is tested rather than a decoder quirk.
  const bytes=new Uint8Array(await response.clone().arrayBuffer());
  expect(Array.from(bytes.slice(0,3))).toEqual([0xef,0xbb,0xbf]);
  const csv=await response.text();
  expect(csv).toContain("'=1+1");
 });
 it("SA-academics-people-65 never drops quiz results filters as later pages are read",async()=>{
  state.reader.mockImplementation(async (_context,_kind,query)=>{
   const page=query.page as number;
   return {items:[row(page)],total:2,totalPages:2};
  });
  const response=await exportSuperAdminLearningDirectory(new Request(
   "https://app.invalid/api/admin/quizzes/export?results=HIDDEN&courseCode=CS401&scope=SHARED"
  ),"QUIZ",state.reader);
  expect(response.status).toBe(200);
  expect(state.reader).toHaveBeenCalledTimes(2);
  for(const call of state.reader.mock.calls){
   expect(call[0]).toBe(state.context);
   expect(call[1]).toBe("QUIZ");
   expect(call[2]).toMatchObject({results:"HIDDEN",courseCode:"CS401",scope:"SHARED"});
  }
  expect(state.reader.mock.calls.map(call=>call[2].page)).toEqual([1,2]);
 });
 it("SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records",async()=>{
  state.reader.mockImplementation(async (_context,_kind,query)=>({
   items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
   total:501,totalPages:21,
  }));
  const response=await exportSuperAdminLearningDirectory(new Request(
   "https://app.invalid/api/admin/assignments/export?status=PUBLISHED"
  ),"ASSIGNMENT",state.reader);
  expect(response.status).toBe(200);
  expect(state.reader).toHaveBeenCalledTimes(20);
  expect(response.headers.get("X-Export-Truncated")).toBe("true");
  const csv=await response.text();
  expect(csv).toContain("TRUNCATED: first 500 records");
  expect(csv).not.toContain("Unit 500");
 });
});
