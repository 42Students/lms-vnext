import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const component=(name:string)=>read("src/components/college/"+name+".tsx");
describe("UX-college-scroll-motion-01 hidden scrollbars retain honest cues",()=>{
  it("keeps one vertical scroller per dialog via the shared accessible scroll cue",()=>{
    const dialog=read("src/components/ui/dialog.tsx");
    expect(dialog).toContain('<ScrollCue axis="y"');
    expect(dialog).toContain('className="min-h-0 flex-1 overflow-hidden"');
    expect(dialog).toContain('data-slot="dialog-header" className="relative z-10');
    expect(dialog).toContain('data-slot="dialog-footer" className="relative z-10');
    expect(dialog).toContain("pb-[max(1rem,env(safe-area-inset-bottom))]");
    for(const name of ["college-faculty-schedule-reassign","college-person-audit-modal"]){
      const s=component(name);
      expect(s).toContain("<Dialog");
      expect(s).not.toMatch(/overflow-(?:y-auto|auto)/);
    }
  });
  it("directory wide table has a keyboard-reachable responsive edge cue",()=>{
    const s=component("college-role-directory-workspace");
    expect(s).toContain('import { DataTable, type DataTableColumn } from "@/components/ui/data-table"');
    expect(s).toContain('<DataTable');
    expect(s).toContain('caption={title+" directory"}');
    const table=read("src/components/ui/data-table.tsx");
    expect(table).toContain('<ScrollCue axis="x"');
    const cue=read("src/components/ui/scroll-cue.tsx");
    expect(cue).toContain("overscroll-x-contain");
    expect(cue).toContain("tabIndex={edges.scrollable ? 0 : -1}");
    expect(cue).toContain('data-scroll-fade="end"');
  });
  it("CSV reports and history use DataTable's shared horizontal ScrollCue",()=>{
    const table=read("src/components/ui/data-table.tsx");
    expect(table).toContain('<ScrollCue axis="x"');
    for(const name of ["college-faculty-csv-import","college-student-csv-import","college-student-import-history"]){
      const s=component(name);
      expect(s).toContain("<DataTable<");
      expect(s).not.toContain("<table");
    }
  });
});
