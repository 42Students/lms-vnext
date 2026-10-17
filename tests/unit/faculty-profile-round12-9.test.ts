import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("requires an affirmative reload choice and warns about other sections",()=>{
 const s=readFileSync("src/components/people/faculty-profile-editor.tsx","utf8");
 expect(s).toContain('<ConfirmDialog open={reloadOpen}');
 expect(s).toContain('title="Reload the latest Faculty profile?"');
 expect(s).toContain("unsaved changes in every section");
 expect(s).toContain('onConfirm={() => window.location.reload()}');
 expect(s).not.toContain('window.confirm(');
});
