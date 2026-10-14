import {describe,expect,it} from "vitest";
import {learnerPlacementHeroGreeting} from "@/modules/placements/learner-dashboard-greeting-model";
describe("learner placements private greeting",()=>{
 it("shows own display name without an inferred title, date or email",()=>{
  expect(learnerPlacementHeroGreeting("  Asha   Kumar ",true)).toBe("Welcome to placements, Asha Kumar");
  expect(learnerPlacementHeroGreeting("Asha",false)).toBe("Your placement overview, Asha");
 });
 it("has a non-fabricated fallback when profile name is unavailable",()=>{
  expect(learnerPlacementHeroGreeting(null,null)).toBe("Your placement overview");
  expect(learnerPlacementHeroGreeting("  ",true)).toBe("Welcome to placements");
  expect(learnerPlacementHeroGreeting("a".repeat(120),false).length).toBeLessThan(115);
 });
});
