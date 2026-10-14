import { describe, expect, it } from "vitest";
import { learnerProjectMatchesSearch } from "@/modules/projects/learner-project-search-model";
const project={title:"Campus project",slug:"campus-analytics",summary:"Attendance dashboard"};

describe("learner project search",()=>{
  it("finds the assigned team's mentor by display name without using private contacts",()=>{
    expect(learnerProjectMatchesSearch(project,"Dr. Kavitha","kavitha")).toBe(true);
    expect(learnerProjectMatchesSearch(project,"Dr. Kavitha","attendance")).toBe(true);
    expect(learnerProjectMatchesSearch(project,null,"kavitha")).toBe(false);
  });
  it("rejects oversized search into the unfiltered state",()=>{
    expect(learnerProjectMatchesSearch(project,null,"x".repeat(101))).toBe(true);
  });
});
