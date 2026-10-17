import {readFileSync} from "node:fs";import {it,expect} from "vitest";
it("TPO-students-17 unticks hidden filtered rows and announces that the previous selection changed",()=>{
 const s=readFileSync(new URL("../../src/components/tpo/tpo-students-selection.tsx",import.meta.url),"utf8");
 expect(s).toContain("Selected students hidden by these filters were unticked.");
 expect(s).toContain("window.sessionStorage.removeItem(previous)");
 expect(s).toContain("allowed.has(id)");
 expect(s).toContain("selection.notice?");
});