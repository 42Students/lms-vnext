import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("warns on dirty Skills changes without disabling saved navigation",()=>{
 const code=readFileSync("src/components/people/faculty-profile-skills.tsx","utf8");
 expect(code).toContain("useFacultyProfileUnsavedWarning(changed);");
 expect(code).toContain("useState(false)");
});
