import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(name:string)=>readFileSync(name,"utf8");
describe("TPO Companies / Recruiters prototype inspector",()=>{
 it("has a real selected recruiter inspector independent of bulk checkbox selection",()=>{
  const roster=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(roster).toContain('import {TpoRecruiterPrototypeInspector} from "./recruiter-prototype-inspector"');
  expect(roster).toContain('const [selectedIds,setSelectedIds]');
  expect(roster).toContain("const [focusedRecruiterId,setFocusedRecruiterId]");
  expect(roster).toContain('onOpen:lead=>setFocusedRecruiterId(lead.id)');
  expect(roster).toContain("<TpoRecruiterPrototypeInspector lead={focusedLead}");
  expect(roster).toContain('onDismiss={()=>setFocusedRecruiterId("")}');
  expect(roster).toContain("sortedVisible.find(lead=>lead.id===focusedRecruiterId)");
 });
 it("does not invent prior conversations, owner names, or employer hiring totals",()=>{
  const inspector=source("src/components/tpo/recruiter-prototype-inspector.tsx");
  for(const field of ["lead.nextFollowupAt","lead.lastActivityAt","lead.ownerName",
   "lead.drivesRan","lead.studentsPlaced","lead.inviteStatus"]){
   expect(inspector).toContain(field);
  }
  expect(inspector).toContain("Drive count unavailable");
  expect(inspector).toContain("Placed count unavailable");
  expect(inspector).toContain('aria-label={"Selected recruiter: "+lead.name}');
  expect(inspector).toContain("RECRUITER_STAGE_LEGACY_LABELS[lead.stage]");
 });
 it("keeps full-page contact management and blocks outbound actions for opted-out contacts",()=>{
  const inspector=source("src/components/tpo/recruiter-prototype-inspector.tsx");
  expect(inspector).toContain('const contactAllowed=!lead.unsubscribedAt');
  expect(inspector).toContain("contactAllowed?validContactPhone");
  expect(inspector).toContain("lead.emailNorm");
  expect(inspector).toContain("has opted out of outreach");
  expect(inspector).toContain('return /^\\+?[1-9]\\d{7,14}$/.test(digits)?digits:null;');
  expect(inspector).toContain('const href="/tpo/recruiters/"+encodeURIComponent(lead.id)');
  expect(inspector).toContain("Open full page");
 });
});
