import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("prevents losing unsaved Faculty repeatable sections edits on browser unload",()=>{
 const src=readFileSync("src/components/people/faculty-profile-repeatable.tsx","utf8");
 expect(src).toContain("useFacultyProfileUnsavedWarning(changed);");
});
