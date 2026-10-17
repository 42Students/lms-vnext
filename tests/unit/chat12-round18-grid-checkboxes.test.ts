import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-R03 makes table and mobile row checkboxes use the same selection as bulk actions",()=>{
 const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
 const students=src("src/components/tpo/tpo-students-spreadsheet.tsx");
 expect(students).toContain('selection={{selected:noteSelection,onChange:setNoteSelection,allIds:shared?.allIds??rows.map(row=>row.membershipId)}}');
 expect(grid).toContain('aria-label="Select all filtered students"');
 expect(grid).toContain("changeRowSelection(rowKey(row),event.target.checked)");
 expect(grid).toContain("selection.selected.includes(rowKey(row))");
 expect(src("src/components/tpo/tpo-bulk-action-panel.tsx")).toContain("useTpoStudentsSelection()");
 expect(src("src/components/tpo/tpo-students-bulk-add.tsx")).toContain("useTpoStudentsSelection()");
});
it("TPO-students-17 keeps grid selection limited to visible page rows and drops hidden IDs on header clear",()=>{
 const grid=src("src/components/tpo/tpo-spreadsheet-grid.tsx");
 expect(grid).toContain("const visibleRowIds=rows.map(rowKey)");
 expect(grid).toContain("const selectAllIds=selection?.allIds??visibleRowIds");
 expect(grid).toContain("selection.selected.filter(id=>!selectAllIds.includes(id))");
 expect(grid).toContain("selection.selected.filter(key=>!range.includes(key))");
});
