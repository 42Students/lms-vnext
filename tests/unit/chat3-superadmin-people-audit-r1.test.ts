import {describe,it,expect} from "vitest";
import {parsePeoplePage,parsePeoplePageSize,peoplePageState} from "@/modules/admin-ui/people-pagination";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("CHAT3-SA-PEOPLE pagination and form audit",()=>{
 it("SA3-PEOPLE-01 never passes NaN to scoped membership pagination on repeated query params",()=>{
  expect(parsePeoplePageSize(["20","50"])).toBe(20);
  expect(parsePeoplePageSize(["50","20"])).toBe(50);
  expect(parsePeoplePageSize("10")).toBe(10);
  expect(parsePeoplePageSize(undefined)).toBe(10);
  expect(parsePeoplePageSize(["not-a-number"])).toBe(10);
  expect(parsePeoplePageSize("Infinity")).toBe(10);
  expect(parsePeoplePage("bad")).toBe(1);
  expect(peoplePageState(100,21,20)).toMatchObject({page:2,limit:20,offset:20,last:21});
 });
 it("SA3-PEOPLE-02 route uses normalized numeric page size before DB fetch and URL pagination",()=>{
  const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/people/page.tsx"),"utf8");
  expect(s).toContain("parsePeoplePageSize(rawPageSize)");
  expect(s).toContain("collegeId,limit:pageSize,offset:(requestedPage-1)*pageSize");
  expect(s).toContain("listCollegePeopleWithRuntime");
  expect(s).not.toContain("Number(rawPageSize)");
 });
 it("SA3-PEOPLE-03 unassigned global directory uses shared 16px/focus/44px controls",()=>{
  const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/people/unassigned/page.tsx"),"utf8");
  for(const c of ['<Input type="search"','<Select name="platformStatus"','<Select name="role"','<Button type="submit" variant="primary"'])expect(s).toContain(c);
  expect(s).toContain("unassignedIdentityScopeAllowed(context.adminScope)");
 });
});