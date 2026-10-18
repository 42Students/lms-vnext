import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/students/import/page.tsx"),"utf8");
describe("/college/students/import UX",()=>{
 it("UX-college-students-import-01 keeps audited user-visible behavior",()=>expect(source).toContain("min-h-11"));
 it("UX-college-students-import-02 keeps audited user-visible behavior",()=>expect(source).toContain("CollegeStudentCsvImport"));
});
