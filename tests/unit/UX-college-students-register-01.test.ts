import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/students/register/page.tsx"),"utf8");
describe("/college/students/register UX",()=>{
 it("UX-college-students-register-01 keeps audited user-visible behavior",()=>{
  const form=readFileSync(join(process.cwd(),"src/components/college/college-student-register-form.tsx"),"utf8");
  expect(source).toContain("<CollegeStudentRegisterForm choices={choices}/>");
  expect(form).toContain('const field="min-h-11 min-w-0 md:min-h-9"');
  expect(form).toContain('<Button variant="primary" type="submit"');
 });
 it("UX-college-students-register-02 keeps audited user-visible behavior",()=>expect(source).toContain("CollegeStudentRegisterForm"));
});
