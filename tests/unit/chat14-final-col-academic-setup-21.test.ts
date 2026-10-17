import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-14 final sprint",()=>{
 it("COL-academic-setup-21 WRONG: department sort, search counter and page-size controls already exist",()=>{
  const departments=read("src/components/admin/department-directory.tsx");
  const programs=read("src/components/admin/admin-program-directory.tsx");
  expect(departments).toContain("Department Name");
  expect(departments).toContain('setNameOrder(nameOrder === "ASC" ? "DESC" : "ASC")');
  expect(departments).toContain("Showing");
  expect(programs).toContain("Rows per page");
  expect(programs).toContain("42lms-program-page-size");
  expect(programs).toContain("Showing");
 });
});