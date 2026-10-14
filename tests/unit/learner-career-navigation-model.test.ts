import {describe,expect,it} from "vitest";
import {learnerCareerNavigationDate} from "@/modules/placements/learner-career-navigation-model";
describe("career calendar bounded navigation",()=>{
 it("shifts day/week/agenda/month deterministically",()=>{
  expect(learnerCareerNavigationDate("2026-10-17","day",-1)).toBe("2026-10-16");
  expect(learnerCareerNavigationDate("2026-10-17","week",1)).toBe("2026-10-24");
  expect(learnerCareerNavigationDate("2026-10-17","agenda",1)).toBe("2026-11-16");
  expect(learnerCareerNavigationDate("2026-01-31","month",1)).toBe("2026-02-28");
 });
 it("prevents invalid year edge and malformed selector",()=>{
  expect(learnerCareerNavigationDate("2000-01-01","day",-1)).toBeNull();
  expect(learnerCareerNavigationDate("2100-12-31","month",1)).toBeNull();
  expect(learnerCareerNavigationDate("2026-02-30","day",1)).toBeNull();
 });
});
