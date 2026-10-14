import {describe,expect,it} from "vitest";
import {hrTeamPage,hrTeamPageSchema,HR_TEAM_PAGE_SIZE} from "@/modules/placements/hr-team-pagination-model";
describe("HR exact-company team roster pagination",()=>{
 it("shows only the requested 25 of an already-authorized and searched set",()=>{
  const employees=Array.from({length:52},(_,i)=>({id:"r"+i}));
  expect(HR_TEAM_PAGE_SIZE).toBe(25);
  expect(hrTeamPage(employees,2)).toMatchObject({page:2,pages:3,total:52,first:26,last:50});
  expect(hrTeamPage(employees,2).rows).toEqual(employees.slice(25,50));
  expect(hrTeamPage(employees,4).rows).toEqual([]);
  expect(hrTeamPageSchema.safeParse("0").success).toBe(false);
  expect(hrTeamPageSchema.safeParse("2").success).toBe(true);
 });
});
