import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({reader:vi.fn()}));
vi.mock("@/modules/courses/college-assessment-aggregate-service",()=>({
 // Keep the boundary shape explicit. The export passes context, kind, and the
 // bounded page query; a bare page-number callback is not equivalent.
 listCollegeAssessmentAggregate:(context:unknown,kind:unknown,query:unknown)=>
  state.reader(context,kind,query),
}));
import {exportCollegeAssessments} from "@/modules/courses/college-assessment-export-service";
const context={} as Parameters<typeof exportCollegeAssessments>[0];
const row=(i:number)=>({
 id:String(i),title:"Quiz "+i,courseName:"Course",courseCode:"CS"+i,
 lessonName:"Lesson",offeringId:"offering",status:"PUBLISHED",
 dueAt:null,deliverySpecific:false,deliveryId:null,points:10,activityCount:0,
 eligibleLearners:10,submittedLearners:2,gradedLearners:1,
 resultsPublished:false,resultsReleaseReady:false,
});
beforeEach(()=>state.reader.mockReset());
describe("COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap",()=>{
 it("rejects extra query keys, invalid filters and custom page parameters before making an authorized service read",async()=>{
  for(const invalid of [
   {page:999},{collegeId:"other"},{status:"UNKNOWN"},{q:"x".repeat(101)},
   {scope:"PRIVATE"},
  ]){
   await expect(exportCollegeAssessments(context,"QUIZ",invalid)).rejects.toThrow();
  }
  expect(state.reader).not.toHaveBeenCalled();
 });
 it("rejects quiz-only results filters and CLOSED state for assignment exports before querying",async()=>{
  await expect(exportCollegeAssessments(context,"ASSIGNMENT",{results:"PUBLISHED"})).rejects.toThrow();
  await expect(exportCollegeAssessments(context,"ASSIGNMENT",{status:"CLOSED"})).rejects.toThrow();
  expect(state.reader).not.toHaveBeenCalled();
 });
 it("reads paginated results using the same current context/kind, returns quoted spreadsheet and bounded pagination",async()=>{
  state.reader.mockImplementation(async (_ctx,kind,query)=>{
   expect(kind).toBe("QUIZ");
   const page=query.page as number;
   return {items:Array.from({length:page===3?1:25},(_,i)=>row((page-1)*25+i)),
    total:51,totalPages:3};
  });
  const out=await exportCollegeAssessments(context,"QUIZ",{status:"PUBLISHED"});
  expect(state.reader).toHaveBeenCalledTimes(3);
  for(const call of state.reader.mock.calls){
   expect(call[0]).toBe(context);
   expect(call[1]).toBe("QUIZ");
   expect(call[2].status).toBe("PUBLISHED");
  }
  expect(out.rows).toHaveLength(51);
  expect(out.truncated).toBe(false);
  expect(out.csv).toContain("Quiz 50");
  expect(out.csv).toContain("Withheld");
  expect(out.csv.startsWith("\ufeff")).toBe(true);
 });
 it("cannot silently export more than 1000 rows, labels truncated set and never fetches page 41",async()=>{
  state.reader.mockImplementation(async (_ctx,_kind,query)=>({
   items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
   total:1001,totalPages:41,
  }));
  const out=await exportCollegeAssessments(context,"ASSIGNMENT",{});
  expect(out.rows).toHaveLength(1000);
  expect(out.truncated).toBe(true);
  expect(out.cap).toBe(1000);
  expect(state.reader).toHaveBeenCalledTimes(40);
  expect(out.csv).toContain("EXPORT TRUNCATED");
  expect(out.csv).toContain("Only the first 1000 matching records");
  expect(out.csv).not.toContain("Quiz 1000");
 });
});
