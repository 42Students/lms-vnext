import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(name:string)=>readFileSync(join(process.cwd(),"src/components/college/"+name+".tsx"),"utf8");
describe("UX-college-csv-tables-01 responsive row reports",()=>{
  for(const [name,label] of [
    ["college-faculty-csv-import","Faculty CSV import row results"],
    ["college-student-csv-import","Student CSV validation and import results"],
    ["college-student-import-history","Bulk import history"],
  ]){
    it(name+" retains all report fields, a named accessible DataTable and real empty copy",()=>{
      const page=source(name);
      expect(page).toContain('import {DataTable} from "@/components/ui/data-table"');
      expect(page).toContain('caption="'+label+'"');
      expect(page).toContain('rows={');
      expect(page).toContain('getRowKey=');
      expect(page).toContain('mobilePriority:"primary"');
      expect(page).toContain('mobilePriority:"secondary"');
      expect(page).toContain('empty={<EmptyState');
      expect(page).toContain(name==="college-student-import-history"?"No bulk import history":"No row results");
      expect(page).not.toContain("<table");
      expect(page).not.toContain("overflow-x-auto");
    });
  }
  it("history handles rejected responses without exposing provider details",()=>{
    const page=source("college-student-import-history");
    expect(page).toContain('if(!response.ok||!Array.isArray(body?.items))throw Error("Import history unavailable.");');
    expect(page).toContain('aria-label="Import history pages"');
    expect(page).toContain('timeZone:"Asia/Kolkata"');
  });
});
