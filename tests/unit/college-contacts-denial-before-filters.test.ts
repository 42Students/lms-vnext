import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("College Contacts role-first denial",()=>{
 it("checks active account role before resolving user-supplied filters",()=>{
  const source=readFileSync("src/app/(authenticated)/college/contacts/page.tsx","utf8");
  const guard=source.indexOf('hasMembershipRole(context,"COLLEGE_ADMIN")');
  const parse=source.indexOf("parseCollegeContactsSearchParams(raw)");
  expect(guard).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(parse);
  expect(source).toContain("The contacts directory is for staff only");
  expect(source).toContain('context.membership.status!=="ACTIVE"');
 });
});
