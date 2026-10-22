import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/students/[membershipId]/page.tsx"),"utf8");
describe("/college/students/[membershipId] UX",()=>{
 it("UX-college-students-detail-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain("aria-label=\"Enrollment lifecycle filter\""));
 it("UX-college-students-detail-02 preserves the new accessible state and responsive contract",()=>{
  expect(source).toContain('<Select name="status"');
  expect(source).toContain('<Button type="submit"');
  expect(source).toContain('max-[767px]:flex-col');
 });
});
