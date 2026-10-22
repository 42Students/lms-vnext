import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO recruiter leads visible legacy parity",()=>{
 it("TPO-recruiters-39 shows the view count and exact add-recruiter action",()=>{
  const page=src("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(page).toContain("of {rows.length} in this view");
  expect(page).toContain("Add recruiter lead");
  expect(page).toContain("<RecruiterLeadCsvImport");
 });
 it("TPO-recruiters-43 retains designation in table and board and names unnamed contacts safely",()=>{
  const page=src("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(page).toContain('{lead.name||"Unnamed contact"}');
  expect(page).toContain('lead.designation?<small');
  expect(page).toContain('key:"Designation",label:"Designation"');
  expect(page).toContain('lead.designation?<span');
 });
 it("TPO-recruiters-40 restores edit-action heading and legacy Save label",()=>{
  const page=src("src/components/tpo/recruiter-lead-detail-workspace.tsx");
  const dialog=src("src/components/ui/dialog.tsx");
  expect(page).toContain('title="Edit contact details"');
  expect(dialog).toContain("aria-labelledby={titleId}");
  expect(dialog).toContain("<h2 id={titleId}");
  expect(page).toContain('{saving ? "Saving…" : "Save"}');
  expect(page).toContain("← Recruiter leads");
  expect(page).toContain('onClick={()=>setNotNowOpen(true)}>Not now</Button>');
  expect(page).toContain('title="Not now"');
  expect(page).toContain("Add follow-up");
  expect(page).toContain("onClick={()=>setFollowOpen(true)}");
  expect(page).toContain("<Dialog open={followOpen}");
 });
});
