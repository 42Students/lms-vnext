import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("College People directory role-first protection",()=>{
 it("rejects wrong-role actors before rendering user-controlled query errors",()=>{
  const source=readFileSync("src/app/(authenticated)/college/people/manage/page.tsx","utf8");
  const guard=source.indexOf('hasMembershipRole(context, "COLLEGE_ADMIN")');
  const parse=source.indexOf("parseCollegePeopleDirectorySearchParams(raw)");
  expect(guard).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(parse);
  expect(source).toContain('redirect("/dashboard")');
 });
});
