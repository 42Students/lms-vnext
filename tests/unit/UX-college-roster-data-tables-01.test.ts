import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+path+"/page.tsx"),"utf8");
describe("UX-college-roster-data-tables-01 responsive roster and faculty detail",()=>{
  it("/college/batches/[cohortId]/students keeps enrollment move actions on mobile",()=>{
    const s=read("batches/[cohortId]/students");
    expect(s).toContain('caption="Students in this batch"');
    expect(s).toMatch(/getRowKey=\{item\s*=>\s*item\.membershipId\}/);
    expect(s).toContain("StudentClassMoveAction membershipId={item.membershipId}");
    expect(s).toMatch(/mobilePriority:\s*"action"/);
    expect(s).toContain("No matching students.");
    expect(s).not.toContain("<table");
  });
  it("/college/electives/[slotId]/allocate retains checked learner IDs inside real form submission",()=>{
    const s=read("electives/[slotId]/allocate");
    expect(s).toContain('caption="Eligible students for allocation"');
    expect(s).toContain('type="checkbox"');
    expect(s).toContain('name="membershipId" value={student.membershipId}');
    expect(s).toMatch(/mobilePriority:\s*"action"/);
    expect(s).toContain('name="identifiers"');
    expect(s).toContain("Allocate selected to");
    expect(s).not.toContain("<table");
  });
  it("/college/faculty/[membershipId] retains every course and assignment history attribute",()=>{
    const s=read("faculty/[membershipId]");
    expect(s).toContain('>Faculty teaching assignments</h2>');
    expect(s).toContain('caption="Persisted teaching assignments"');
    expect(s).toMatch(/mobilePriority:\s*"primary"/);
    expect(s).toContain("item.offeringId");
    expect(s).toContain("item.cohortName");
    expect(s).toContain("item.role");
    expect(s).toContain("item.status");
    expect(s).toContain("No college-scoped teaching assignments recorded.");
    expect(s).not.toContain("<table");
  });
});
