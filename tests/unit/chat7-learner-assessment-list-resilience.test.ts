import { describe, expect, it } from "vitest";
import { learnerAssessmentClock } from "@/modules/courses/learner-assessment-clock-model";
import { normalizeLearnerAssessmentSearch, learnerAssessmentMatchesSearch } from "@/modules/courses/learner-assessment-search-model";
import { learnerAssessmentEmptyMessage } from "@/modules/courses/learner-assessment-empty-model";
import { learnerAssessmentSort } from "@/modules/courses/learner-assessment-sort-model";
import { learnerAssessmentDrawerSelectionAllowed } from "@/modules/courses/learner-assessment-drawer-scope-model";

const base = { title:"Algorithms", description:"Graphs and paths", lessonName:"Shortest paths", courseName:"Algorithms II", courseCode:"CS209" };
const a = { id:"a", title:"Zebra", dueAt:"2099-02-10T12:00:00.000Z", createdAt:"2099-01-01T00:00:00.000Z" };
const b = { id:"b", title:"Alpha", dueAt:"2099-01-10T12:00:00.000Z", createdAt:"2099-01-02T00:00:00.000Z" };
const c = { id:"c", title:"Undated", dueAt:null, createdAt:"malformed" };

describe("COURSES7 learner assessment directory resilience", () => {
  it("COURSES7-10 advances time only from a persisted snapshot and positive elapsed duration", () => {
    expect(learnerAssessmentClock(1000, 250)).toBe(1250);
    expect(learnerAssessmentClock(1000, -100)).toBe(1000);
    expect(learnerAssessmentClock(1000, Number.NaN)).toBe(1000);
    expect(learnerAssessmentClock(1000, Number.POSITIVE_INFINITY)).toBe(1000);
  });
  it("COURSES7-06 matches own-course assessment text case-insensitively without accepting unbounded search", () => {
    expect(normalizeLearnerAssessmentSearch(null)).toBe("");
    expect(normalizeLearnerAssessmentSearch("  algorithms  ")).toBe("algorithms");
    expect(normalizeLearnerAssessmentSearch("x".repeat(200))).toHaveLength(100);
    expect(learnerAssessmentMatchesSearch(base, "cS209")).toBe(true);
    expect(learnerAssessmentMatchesSearch(base, "GRAPHs")).toBe(true);
    expect(learnerAssessmentMatchesSearch(base, "biology")).toBe(false);
  });
  it("COURSES7-06 orders dated work before undated and uses deterministic ties regardless of input mutation", () => {
    const original = [a, c, b] as const;
    expect(learnerAssessmentSort(original, "DUE").map(item=>item.id)).toEqual(["b","a","c"]);
    expect(learnerAssessmentSort(original, "CREATED").map(item=>item.id)).toEqual(["b","a","c"]);
    expect(learnerAssessmentSort(original, "TITLE").map(item=>item.id)).toEqual(["b","c","a"]);
    expect(learnerAssessmentSort(original, "not-a-mode").map(item=>item.id)).toEqual(["b","a","c"]);
    expect(original.map(item=>item.id)).toEqual(["a","c","b"]);
  });
  it("COURSES7-06 distinguishes a filtered empty list from no published assessments", () => {
    expect(learnerAssessmentEmptyMessage({kind:"ASSIGNMENT",courseSelected:false,search:"systems",stateFilter:"ALL"}).title).toBe("No assignments match “systems”");
    expect(learnerAssessmentEmptyMessage({kind:"QUIZ",courseSelected:true,search:"",stateFilter:"DUE"}).title).toBe("No quizzes in this state");
    expect(learnerAssessmentEmptyMessage({kind:"QUIZ",courseSelected:true,search:"",stateFilter:"ALL"}).title).toBe("No quizzes in this course");
  });
  it("COURSES7-09 invalidates stale assignment drawer selection on delivery switch or quiz-only filtering", () => {
    const visible = [{kind:"ASSIGNMENT" as const,id:"assignment-a",deliveryId:"delivery-b"},{kind:"QUIZ" as const,id:"quiz-a",deliveryId:"delivery-b"}];
    expect(learnerAssessmentDrawerSelectionAllowed("delivery-b:assignment-a",visible)).toBe(true);
    expect(learnerAssessmentDrawerSelectionAllowed("delivery-a:assignment-a",visible)).toBe(false);
    expect(learnerAssessmentDrawerSelectionAllowed("delivery-b:quiz-a",visible)).toBe(false);
    expect(learnerAssessmentDrawerSelectionAllowed(null,visible)).toBe(false);
    expect(learnerAssessmentDrawerSelectionAllowed("delivery-b:assignment-a",[])).toBe(false);
  });
});
