import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-17 preserves a tenant-scoped whole-view 5000-row selection across pages and range-selects with Shift",()=>{
 const provider=s("src/components/tpo/tpo-students-selection.tsx");
 const page=s("src/app/(authenticated)/tpo/students/page.tsx");
 const grid=s("src/components/tpo/tpo-spreadsheet-grid.tsx");
 expect(provider).toContain('window.sessionStorage.setItem(key');
 expect(provider).toContain("allowed.has(id)");
 expect(page).toContain("roster.total<=5000");
 expect(page).toContain("page:undefined,pageSize:undefined,columns:undefined");
 expect(page).toContain("scopeKey={context.membership.id");
 expect(grid).toContain("selectAllIds=selection?.allIds??visibleRowIds");
 expect(grid).toContain("visibleRowIds.slice(Math.min(anchor.current,index)");
 expect(grid).toContain("event.nativeEvent.shiftKey");
 expect(s("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("shared?.allIds??rows.map");
});