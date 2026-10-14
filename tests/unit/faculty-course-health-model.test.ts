import { describe, expect, it } from "vitest";
import {
  facultyCourseHealthHref, facultyCourseHealthParamsSchema,
  responseCoverage, selectFacultyCourseHealthCandidates,
  type FacultyCourseHealthCandidate,
} from "@/modules/courses/faculty-course-health-model";

const a="00000000-0000-4000-8000-000000000001";
const b="00000000-0000-4000-8000-000000000002";
const items: FacultyCourseHealthCandidate[] = [
  {id:"a1",deliveryId:a,title:"First",kind:"ASSIGNMENT",status:"PUBLISHED",dueAt:null},
  {id:"q1",deliveryId:a,title:"Quiz",kind:"QUIZ",status:"PUBLISHED",dueAt:new Date("2026-10-14T12:00:00Z")},
  {id:"q2",deliveryId:a,title:"Draft",kind:"QUIZ",status:"DRAFT",dueAt:null},
  {id:"a2",deliveryId:b,title:"Other Section",kind:"ASSIGNMENT",status:"PUBLISHED",dueAt:null},
];

describe("Faculty Section assessment health model",() => {
  it("includes only published assessments from the exact Section delivery",() => {
    expect(selectFacultyCourseHealthCandidates(items,{deliveryId:a,kind:"ALL",page:1})
      .items.map(x=>x.id)).toEqual(["q1","a1"]);
    expect(selectFacultyCourseHealthCandidates(items,{deliveryId:a,kind:"QUIZ",page:1})
      .items.map(x=>x.id)).toEqual(["q1"]);
    expect(selectFacultyCourseHealthCandidates(items,{deliveryId:b,kind:"QUIZ",page:1})
      .items).toEqual([]);
  });
  it("uses a bounded five-report page, with a real empty page",() => {
    expect(selectFacultyCourseHealthCandidates(items,{deliveryId:a,kind:"ALL",page:999}))
      .toMatchObject({total:2,totalPages:1,page:1});
    expect(selectFacultyCourseHealthCandidates([],{deliveryId:a,kind:"ALL",page:999}))
      .toMatchObject({total:0,totalPages:1,page:1,items:[]});
  });
  it("does not fabricate response coverage without a valid roster denominator",() => {
    expect(responseCoverage(10,4)).toBe(40);
    expect(responseCoverage(0,0)).toBeNull();
    expect(responseCoverage(10,20)).toBe(100);
  });
  it("strictly validates only delivery, kind and page",() => {
    expect(facultyCourseHealthParamsSchema.safeParse({deliveryId:a}).success).toBe(true);
    expect(facultyCourseHealthParamsSchema.safeParse({deliveryId:a,collegeId:b}).success).toBe(false);
    expect(facultyCourseHealthParamsSchema.safeParse({deliveryId:a,kind:"GRADED"}).success).toBe(false);
    expect(facultyCourseHealthParamsSchema.safeParse({deliveryId:"invalid"}).success).toBe(false);
    expect(facultyCourseHealthParamsSchema.safeParse({deliveryId:a,page:0}).success).toBe(false);
  });
  it("constructs exact delivery-scoped URLs only",() => {
    expect(facultyCourseHealthHref({deliveryId:a,kind:"QUIZ",page:2}))
      .toBe("/teacher/courses/"+a+"/assessment-health?kind=QUIZ&page=2");
  });
});
