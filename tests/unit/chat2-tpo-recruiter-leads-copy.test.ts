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
  expect(page).toContain('lead.designation?<p');
  expect(page).toContain('lead.designation?<span');
 });
 it("TPO-recruiters-40 restores edit-action heading and legacy Save label",()=>{
  const page=src("src/components/tpo/recruiter-lead-detail-workspace.tsx");
  expect(page).toContain('aria-label="Edit contact details"');
  expect(page).toContain("Edit contact details</h2>");
  expect(page).toContain(">Save</button>");
  expect(page).toContain("← Recruiter leads");
  expect(page).toContain('onClick={() => setNotNowOpen(true)}>Not now</button>');
  expect(page).toContain('<h2 className="text-lg font-semibold">Not now</h2>');
  expect(page).toContain('<h2 className="text-lg font-semibold">Log activity</h2>');
 });
});
