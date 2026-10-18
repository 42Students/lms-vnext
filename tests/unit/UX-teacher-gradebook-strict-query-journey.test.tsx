import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({actor:vi.fn(),data:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.actor}));
vi.mock("@/modules/courses/faculty-gradebook-service",()=>({
 getFacultyPublishedGradebook:stubs.data,
}));
import FacultyGradebookPage from "@/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page";

const deliveryId="11111111-1111-4111-8111-111111111111";
function page(searchParams:Record<string,string|string[]|undefined>={},
 id=deliveryId){
 return FacultyGradebookPage({
  params:Promise.resolve({deliveryId:id}),
  searchParams:Promise.resolve(searchParams),
 });
}
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.actor.mockResolvedValue({user:{id:"faculty"}});
 stubs.data.mockResolvedValue({rosterSize:0,publishedAssessments:0,rows:[]});
});

describe("FAC-GRADEBOOK-UX-01 Faculty gradebook URL, privacy and recovery",()=>{
 it("denies repeated page keys before resolving context and without leaking Section results",async()=>{
  for(const searchParams of [
   {page:["1","999"]},
   {page:["2"]},
   {search:["student","another student"]},
   {role:"SUPER_ADMIN"},
   {collegeId:"foreign"},
   {page:"1.5"},
  ]){
   const rendered=renderToStaticMarkup(await page(searchParams));
   expect(rendered).toContain("Invalid gradebook link or filters");
   expect(rendered).toContain("Return to the gradebook");
  }
  expect(stubs.actor).not.toHaveBeenCalled();
  expect(stubs.data).not.toHaveBeenCalled();
 });
 it("handles invalid and forged delivery links without querying private grade data",async()=>{
  const rendered=renderToStaticMarkup(await page({},"not-uuid"));
  expect(rendered).toContain("Invalid gradebook link or filters");
  expect(rendered).toContain("/teacher/courses");
  expect(stubs.actor).not.toHaveBeenCalled();
  expect(stubs.data).not.toHaveBeenCalled();
 });
 it("renders a truthful empty learner state for the authorized exact Section",async()=>{
  const rendered=renderToStaticMarkup(await page());
  expect(rendered).toContain("Published gradebook");
  expect(rendered).toContain("No current enrolled learners");
  expect(rendered).toContain("No scores were inferred");
  expect(rendered).toContain("Download full Section CSV");
  expect(stubs.data).toHaveBeenCalledWith({user:{id:"faculty"}},{deliveryId});
 });
 it("uses a private unmatched-search state without sending notifications or changing grades",async()=>{
  stubs.data.mockResolvedValue({
   rosterSize:1,publishedAssessments:2,
   rows:[{membershipId:"member-1",displayName:"Learner A",
    email:null,rollNumber:"21",earned:8,possible:10,percent:80,
    gradedCount:1,publishedAssessments:2,hasUnknown:true}],
  });
  const rendered=renderToStaticMarkup(await page({search:"never-match"}));
  expect(rendered).toContain("No matching learners");
  expect(rendered).toContain("Published grades were not inferred");
  expect(rendered).toContain("Showing 0 of 1 authorized learners");
  expect(rendered).not.toContain("Learner A");
 });
});
