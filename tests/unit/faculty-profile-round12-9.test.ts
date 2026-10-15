import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("requires an affirmative reload choice and warns about other sections",()=>{
 const s=readFileSync("src/components/people/faculty-profile-editor.tsx","utf8");
 expect(s).toContain('window.confirm("Reload the latest Faculty profile?');
 expect(s).toContain("unsaved changes in every section");
 expect(s).toContain('))window.location.reload();');
});
