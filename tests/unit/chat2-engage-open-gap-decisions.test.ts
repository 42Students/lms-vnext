import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Engage remaining safe and reachable controls",()=>{
 it("TPO-recruiters-07 provides the actual counted Needs doing chips and zero state",()=>{
  const s=src("src/components/tpo/recruiter-leads-workspace.tsx");
  for(const label of ["Follow-ups due","No next step","Gone quiet","Unassigned","Nothing right now.","recruiters with access"])
   expect(s).toContain(label);
  expect(s).toContain('aria-label="Needs doing"');
  expect(s).toContain("needsExpanded");
  expect(s).toContain("rows.filter(row=>row.chips?.includes");
 });
 it("TPO-recruiters-30 links a scoped detected duplicate and preserves contact form details",()=>{
  const s=src("src/components/tpo/recruiter-lead-detail-workspace.tsx");
  expect(s).toContain("Another recruiter already has those contact details.");
  expect(s).toContain('encodeURIComponent(collegeId)+"&contact="+encodeURIComponent(contact)');
  expect(s).toContain('value.lead.id!==leadId');
  expect(s).toContain("Contact already exists:");
  expect(s).toContain('encodeURIComponent(duplicateLead.id)');
  expect(s).toContain("Open {duplicateLead.name}");
  expect(s).toContain("Edit contact details");
 });
 it("TPO-recruiters-36 has horizontally reachable stages and keyboard-trapped edit dialogs while retaining mobile actions",()=>{
  const s=src("src/components/tpo/recruiter-leads-workspace.tsx");
  const edit=src("src/components/tpo/recruiter-lead-detail-workspace.tsx");
  expect(s).toContain('role="region" aria-label="Recruiter stage board"');
  expect(s).toContain("overflow-x-auto");
  expect(s).toContain("Move to… / Actions");
  expect(edit).toContain("function keepRecruiterDialogFocus");
  expect(edit).toContain('role="dialog" aria-modal="true"');
 });
});