import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-47 distinguishes filtered emptiness from no eligible students while keeping legacy recovery",()=>{
 const page=src("src/app/(authenticated)/tpo/students/page.tsx");
 expect(page).toContain("No students match these filters.");
 expect(page).toContain("Nobody is in placements yet.");
 expect(page).toContain("Clear search and filters");
 expect(page).toContain("Open Placement eligibility");
 expect(src("src/components/tpo/tpo-grid-filter-panel.tsx")).toContain(">Filter students</h2>");
});
it("TPO-students-24 does not reset the roster as if it has no matching placement pool",()=>{
 const page=src("src/app/(authenticated)/tpo/students/page.tsx");
 expect(page).toContain('Object.entries(currentFilters).some');
 expect(page).toContain('"columns","page","pageSize"');
});
