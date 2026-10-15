import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("warns on dirty Metadata changes without disabling saved navigation",()=>{
 const code=readFileSync("src/components/people/faculty-profile-metadata.tsx","utf8");
 expect(code).toContain("useFacultyProfileUnsavedWarning(dirty);");
 expect(code).toContain("useState(false)");
});
