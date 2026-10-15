import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("registers an unload guard only while Faculty profile text is dirty",()=>{
 const src=readFileSync("src/components/people/faculty-unsaved-warning.ts","utf8");
 expect(src).toContain('if(!dirty)return;');
 expect(src).toContain('window.addEventListener("beforeunload",onBeforeUnload)');
 expect(src).toContain('window.removeEventListener("beforeunload",onBeforeUnload)');
});
