import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(name:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+name+"/page.tsx"),"utf8");
const shared=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
describe("UX-college-dash-attendance-tables-01",()=>{
  it("/college preserves low-attendance threshold evidence without nested scrolling",()=>{
    const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/page.tsx"),"utf8");
    expect(s).toContain('caption="Learners below attendance threshold"');
    expect(s).toContain('rows={lowAttendance.rows}');
    expect(s).toContain('lowAttendance.threshold');
    expect(s).toContain('row.attended+" / "+row.marked');
    expect(s).toContain("No learners below the attendance threshold.");
    expect(s).toContain("Showing first 200 at-risk learners.");
    expect(s).not.toContain("<table");
  });
  it("/college/attendance/corrections preserves full IST session, status and marking-window evidence",()=>{
    const s=read("attendance/corrections");
    expect(s).toContain("getCollegeCorrectionRead(await getCurrentRequestContext()");
    expect(s).toContain('caption="Recorded attendance correction windows"');
    expect(s).toContain("item.attendanceStatus??");
    expect(s).toContain("item.facultyMarkingWindow.replaceAll");
    expect(s).toContain("No persisted scheduled sessions overlap this date range.");
    expect(s).not.toContain("<table");
  });
  it("shared DataTable owns actual responsive sticky headers, mobile cards and dynamic edge fades",()=>{
    expect(shared).toContain('sm:sticky sm:top-0');
    expect(shared).toContain('<ScrollCue axis="x"');
    expect(shared).toContain('sm:hidden');
  });
});
