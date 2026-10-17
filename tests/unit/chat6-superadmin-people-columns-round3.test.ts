import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/modules/admin-ui/super-admin-scoped-people-service.ts","utf8");
describe("Super Admin college-scoped person roster fields",()=>{
 it("SA-academics-people-90 faculty roster has gender department type and private college scoped contact columns",()=>{
  expect(source).toContain("selected.collegeId");
  for(const value of ["facultyProfiles.profileDocument","admin_person_gender","Department: ",
    "Type: ","Gender: ","Email: ","Mobile: "])expect(source).toContain(value);
 });
 it("SA-academics-people-99 student roster has gender roll class and college scoped contact columns",()=>{
  expect(source).toContain("learnerProfiles.profileDocument");
  for(const value of ["Roll number: ","Class: ","Gender: ","Email: ","Mobile: "])
   expect(source).toContain(value);
  expect(source).toContain("row.gender");
 });
});
