import {describe,expect,it,vi} from "vitest";

vi.mock("@/modules/courses/college-assessment-aggregate-service",()=>({
  listCollegeAssessmentAggregate:vi.fn(),
}));

import {exportCollegeAssessments} from "@/modules/courses/college-assessment-export-service";

const context={} as Parameters<typeof exportCollegeAssessments>[0];
const row=(id:number)=>({
  id:String(id),title:"Quiz "+id,courseName:"Example",courseCode:"EX101",
  lessonName:"Lesson",offeringId:"offering-1",status:"PUBLISHED",dueAt:null,
  deliverySpecific:false,deliveryId:null,points:10,activityCount:0,
  eligibleLearners:3,submittedLearners:1,gradedLearners:0,
  resultsPublished:false,resultsReleaseReady:false,
});
const first=()=>({
  items:Array.from({length:20},(_,index)=>row(index)),
  total:21,totalPages:2,collegeId:"college-a",page:1,
});
const second=()=>({
  items:[row(20)],total:21,totalPages:2,collegeId:"college-a",page:2,
});
type Reader=NonNullable<Parameters<typeof exportCollegeAssessments>[3]>;
const run=(mutate:(value:ReturnType<typeof second>)=>ReturnType<typeof second>)=>{
  const reader=vi.fn(async (_ctx:unknown,_kind:unknown,query:{page:number})=>
    query.page===1?first():mutate(second()));
  return {
    result:exportCollegeAssessments(context,"QUIZ",{exportMode:"ALL"},reader as unknown as Reader),
    reader,
  };
};

describe("UX-G173 assessment export snapshot safety",()=>{
  it("exports two stable pages, preserving 21 unique rows and the current college",async()=>{
    const {result,reader}=run(value=>value);
    const csv=await result;
    expect(csv.rows).toHaveLength(21);
    expect(new Set(csv.rows.map(item=>item.id)).size).toBe(21);
    expect(csv.collegeId).toBe("college-a");
    expect(csv.csv.startsWith("\uFEFF")).toBe(true);
    expect(reader).toHaveBeenCalledTimes(2);
  });
  it("rejects changed totals even when later queries return the same number of pages",async()=>{
    const {result}=run(value=>({...value,total:22}));
    await expect(result).rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
  });
  it("rejects a different college scope on later pages rather than mixing audiences",async()=>{
    const {result}=run(value=>({...value,collegeId:"college-b"}));
    await expect(result).rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
  });
  it("rejects duplicated stable record IDs shifted between offset pages",async()=>{
    const {result}=run(value=>({...value,items:[row(0)]}));
    await expect(result).rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
  });
  it("rejects incomplete pages to avoid a misleading partial downloaded report",async()=>{
    const {result}=run(value=>({...value,items:[]}));
    await expect(result).rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
  });
  it("rejects an oversized first page instead of overreading beyond the fixed cap",async()=>{
    const reader=vi.fn(async()=>({
      ...first(),items:Array.from({length:21},(_,i)=>row(i)),
    }));
    await expect(exportCollegeAssessments(context,"QUIZ",{exportMode:"ALL"},
      reader as unknown as Reader)).rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
    expect(reader).toHaveBeenCalledTimes(1);
  });
  it("rejects oversized and wrong-page responses in legacy current-page export mode",async()=>{
    const oversized=vi.fn(async()=>({...first(),
      items:Array.from({length:21},(_,i)=>row(i)),page:2,
    }));
    await expect(exportCollegeAssessments(context,"QUIZ",
      {exportMode:"PAGE",page:2},oversized as unknown as Reader))
      .rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
    const mismatched=vi.fn(async()=>({...first(),page:1}));
    await expect(exportCollegeAssessments(context,"QUIZ",
      {exportMode:"PAGE",page:2},mismatched as unknown as Reader))
      .rejects.toThrow("COLLEGE_ASSESSMENT_EXPORT_STALE");
  });
});
