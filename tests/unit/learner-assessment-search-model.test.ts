import { describe, expect, it } from "vitest";
import { learnerAssessmentMatchesSearch, normalizeLearnerAssessmentSearch } from "@/modules/courses/learner-assessment-search-model";

const assignment={title:"Problem Set One",description:"Graph traversal",lessonName:"Graphs",courseName:"Algorithms",courseCode:"CS200"};
describe("learner assessment search",()=>{
  it("filters only provided learner-scope cards without extra reads",()=>{
    expect(learnerAssessmentMatchesSearch(assignment,"CS200")).toBe(true);
    expect(learnerAssessmentMatchesSearch(assignment,"graph")).toBe(true);
    expect(learnerAssessmentMatchesSearch(assignment,"other")).toBe(false);
  });
  it("bounds oversized input without unexpectedly broadening to all assignments",()=>{
    expect(normalizeLearnerAssessmentSearch("Graph"+"x".repeat(200))).toHaveLength(100);
    expect(learnerAssessmentMatchesSearch(assignment,"x".repeat(101))).toBe(false);
  });
});
