import {describe,expect,it} from "vitest";
import {HR_TEAM_PAGE_SIZE,hrTeamPage,hrTeamPageSchema} from "@/modules/placements/hr-team-pagination-model";
import {readFileSync} from "node:fs";
describe("UX-HR-TEAM-PAGINATION-49 recover from stale company roster pages",()=>{
 const members=Array.from({length:26},(_,i)=>({id:i+1}));
 it("preserves exact page size and input order on first/last pages",()=>{
  expect(HR_TEAM_PAGE_SIZE).toBe(25);
  const first=hrTeamPage(members,1),last=hrTeamPage(members,2);
  expect(first.rows).toHaveLength(25);
  expect(first.rows[0]?.id).toBe(1);
  expect(last.rows).toEqual([{id:26}]);
  expect(last).toMatchObject({page:2,pages:2,total:26,first:26,last:26});
 });
 it("clamps a remembered page beyond current filtered results",()=>{
  const result=hrTeamPage(members.slice(0,4),9000);
  expect(result).toMatchObject({page:1,pages:1,total:4,first:1,last:4});
  expect(result.rows).toHaveLength(4);
  expect(result.rows[0]?.id).toBe(1);
 });
 it("returns a stable friendly empty state when a roster becomes empty",()=>{
  const result=hrTeamPage([],10000);
  expect(result).toEqual({rows:[],page:1,pages:0,total:0,first:0,last:0});
 });
 it.each([0,-1,NaN,1.5,Infinity])("fails closed on invalid direct model page input %s",input=>{
  expect(hrTeamPage(members,input).page).toBe(1);
 });
 it("rejects malformed URL page values before calling company service",()=>{
  expect(hrTeamPageSchema.safeParse("0").success).toBe(false);
  expect(hrTeamPageSchema.safeParse("1.5").success).toBe(false);
  expect(hrTeamPageSchema.safeParse("10001").success).toBe(false);
 });
 it("company page displays clamped results and pagination from its model output",()=>{
  const source=readFileSync("src/app/(authenticated)/hr/company/page.tsx","utf8");
  expect(source).toContain("const teamPageResult = hrTeamPage(matchingTeam,teamPage.data)");
  expect(source).toContain("teamPageResult.rows.map(");
  expect(source).toContain("teamPageResult.page");
 });
});
