import { describe, expect, it } from "vitest";
import {
  facultyResponseFollowUpHref,
  facultyResponseFollowUpPage,
  facultyResponseFollowUpQuerySchema,
  limitedMissingLearners,
  selectPastDueAssessments,
  type FacultyResponseCandidate,
} from "@/modules/courses/faculty-response-followup-model";

const due = new Date("2026-10-14T10:00:00Z");
const now = new Date("2026-10-14T11:00:00Z");
const base = {
  id:"a",deliveryId:"delivery-a",title:"Assignment A",kind:"ASSIGNMENT" as const,
  status:"PUBLISHED",dueAt:due,courseName:"CS101",sectionName:"A",
};
const cases: FacultyResponseCandidate[] = [
  base,
  {...base,id:"b",status:"DRAFT"},
  {...base,id:"c",dueAt:null},
  {...base,id:"d",dueAt:new Date("2026-10-15T10:00:00Z")},
  {...base,id:"e",kind:"QUIZ",title:"Quiz E"},
];

describe("Faculty missed-response follow-up model", () => {
  it("includes only published assessments with a passed due date", () => {
    expect(selectPastDueAssessments(cases,{kind:"ALL",search:""},now)
      .map(row=>row.id)).toEqual(["a","e"]);
    expect(selectPastDueAssessments(cases,{kind:"QUIZ",search:""},now)
      .map(row=>row.id)).toEqual(["e"]);
    expect(selectPastDueAssessments(cases,{kind:"ALL",search:"CS101"},now)).toHaveLength(2);
  });
  it("excludes even published assessments before the deadline", () => {
    expect(selectPastDueAssessments(cases,{kind:"ALL",search:""},
      new Date("2026-10-14T09:00:00Z"))).toEqual([]);
  });
  it("limits individual learner previews and clamps stale pages", () => {
    expect(limitedMissingLearners([1,2,3,4],2)).toEqual({
      total:4,preview:[1,2],hiddenCount:2,
    });
    expect(facultyResponseFollowUpPage([],99)).toMatchObject({
      total:0,page:1,totalPages:1,items:[],
    });
  });
  it("rejects tenant selectors and unbounded searches", () => {
    expect(facultyResponseFollowUpQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
    expect(facultyResponseFollowUpQuerySchema.safeParse({membershipId:"other"}).success).toBe(false);
    expect(facultyResponseFollowUpQuerySchema.safeParse({page:0}).success).toBe(false);
    expect(facultyResponseFollowUpQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
  });
  it("constructs only validated query fields in navigation", () => {
    expect(facultyResponseFollowUpHref({kind:"QUIZ",search:"A & B",page:2}))
      .toBe("/teacher/response-followups?kind=QUIZ&search=A+%26+B&page=2");
  });
});
