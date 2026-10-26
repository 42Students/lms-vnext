import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TpoRecruiterPrototypeStageRibbon} from "@/components/tpo/recruiter-prototype-stage-ribbon";
import {tpoRecruiterFollowupSignal} from "@/modules/placements/tpo-recruiter-attention-model";
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
 it("shows the eight genuine prototype stage totals with no assumed sample counts",()=>{
  const html=renderToStaticMarkup(createElement(TpoRecruiterPrototypeStageRibbon,{
   rows:[{stage:"NEW"},{stage:"JOINED"},{stage:"JOINED"},{stage:"NOT_NOW"}],
   selected:"JOINED",onSelect:()=>{},
  }));
  for(const name of ["Everyone: 4","Not contacted: 1","In touch: 0","Invited: 0",
   "Joined: 2","Drive planned: 0","Hired from you: 0","Paused: 1"]){
   expect(html).toContain('aria-label="'+name+'"');
  }
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  expect(html).not.toContain("12</strong>");
 });
 it("connects stage selection to an existing filtered authorized roster",()=>{
  const roster=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(roster).toContain('import {TpoRecruiterPrototypeStageRibbon} from "./recruiter-prototype-stage-ribbon"');
  expect(roster).toContain('rows={rows} selected={stage} onSelect={value=>updateFilter("stage",value)}');
  expect(roster).toContain('if(kind==="stage")setStage(');
  expect(roster).toContain("filterEngageRoster(rosterRows,filters");
 });

 it("labels follow-up lateness by India-local date instead of elapsed hours",()=>{
  const now=new Date("2026-10-26T08:00:00Z"); // 13:30 IST
  expect(tpoRecruiterFollowupSignal("2026-10-26T01:00:00Z",now))
    .toEqual({label:"Follow up · today",lateDays:0});
  expect(tpoRecruiterFollowupSignal("2026-10-25T18:00:00Z",now))
    .toEqual({label:"Follow up · 1 day late",lateDays:1});
  expect(tpoRecruiterFollowupSignal("2026-10-23T06:00:00Z",now))
    .toEqual({label:"Follow up · 3 days late",lateDays:3});
  expect(tpoRecruiterFollowupSignal("2026-10-27T06:00:00Z",now))
    .toEqual({label:"Follow up · in 1 day",lateDays:0});
  expect(tpoRecruiterFollowupSignal(null,now))
    .toEqual({label:"No next follow-up recorded",lateDays:0});
  expect(tpoRecruiterFollowupSignal("not-a-date",now))
    .toEqual({label:"Follow-up date unavailable",lateDays:0});
 });

});
