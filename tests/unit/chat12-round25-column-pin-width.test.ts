import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
it("TPO-students-39 remembers user-chosen column order visibility pinning and bounded resizing per browser",()=>{
 const src=readFileSync(new URL("../../src/components/tpo/tpo-spreadsheet-grid.tsx",import.meta.url),"utf8");
 expect(src).toContain('viewKey=storageKey?storageKey+":layout-v2":null');
 expect(src).toContain("updateLayout(col.key,{width:Math.max(100");
 expect(src).toContain("updateLayout(col.key,{width:Math.min(500");
 expect(src).toContain('aria-pressed={Boolean(columnView[col.key]?.pinned)}');
 expect(src).toContain("position:\"sticky\"");
 expect(src).toContain('window.localStorage.setItem(viewKey');
 expect(src).toContain('window.localStorage.removeItem(storageKey+":layout-v2")');
 expect(src).toContain("router.replace(pathname");
});