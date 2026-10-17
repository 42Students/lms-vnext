import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-academics-people-92 maintains legacy First Name Last Name and 10-digit input with optional demographic fields",()=>{
 const source=readFileSync("src/components/college/college-student-register-form.tsx","utf8");
 for(const label of ["First Name","Last Name","Mobile Number","Gender","Date of Birth","Address"])
  expect(source).toContain(label);
 expect(source).toContain("indianMobileToE164(phoneE164)");
 expect(source).toContain('if(!indianMobileToE164(phoneE164))');
 expect(source).toContain("gender,dateOfBirth,address");
 const editor=readFileSync("src/modules/people/college-directory-person-editor-service.ts","utf8");
 expect(editor).toContain("personalDetails");
 expect(editor).toContain("profileDocument");
});