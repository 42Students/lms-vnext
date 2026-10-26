import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TpoRecruiterPrototypeStageRibbon} from "@/components/tpo/recruiter-prototype-stage-ribbon";
import {TpoRecruiterPrototypeRoster} from "@/components/tpo/recruiter-prototype-roster";
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
  expect(inspector).toContain('href={href+"#tpo-recruiter-log-interaction"}');
  expect(source("src/components/tpo/recruiter-lead-detail-workspace.tsx"))
   .toContain('id="tpo-recruiter-log-interaction"');
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

 it("renders the six-column screenshot roster with real fields and selection",()=>{
  const html=renderToStaticMarkup(createElement(TpoRecruiterPrototypeRoster,{
   rows:[{id:"lead-1",name:"Recruiter A",designation:"Campus Lead",companyName:"Test Employer",
    stage:"JOINED",nextFollowupAt:"2026-10-23T06:00:00Z",
    lastActivityAt:"2026-10-25T06:00:00Z",ownerName:"Officer B"}],
   selectedId:"lead-1",onSelect:()=>{},now:new Date("2026-10-26T08:00:00Z"),
  }));
  for(const heading of ["Recruiter","Company","Where you are","Next step","Last activity","Handled by"]){
   expect(html).toContain(">"+heading+"</th>");
  }
  for(const signal of ["Recruiter A","Campus Lead","Test Employer","Officer B","Follow up · 3 days late"]){
   expect(html).toContain(signal);
  }
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('aria-label="Select Recruiter A details"');
  expect(html).toContain('aria-label="View Recruiter A in the detail panel"');
  expect(html).toContain("1 in this view");
  expect(html).not.toContain("Rohit Mehta");
 });
 it("shows selectable prototype rows and supports real column visibility",()=>{
  const html=renderToStaticMarkup(createElement(TpoRecruiterPrototypeRoster,{
   rows:[{id:"recruiter-1",name:"Aanya",designation:"Hiring Lead",companyName:"Example Company",
    stage:"NEW",nextFollowupAt:null,lastActivityAt:null,ownerName:"Officer One"}],
   selectedId:"recruiter-1",onSelect:()=>{},now:new Date("2026-10-27T03:00:00Z"),
   columns:["recruiter","stage","next"],
  }));
  expect(html).toContain("Select Aanya details");
  expect(html).toContain('aria-selected="true"');
  expect(html).toContain("Where you are");
  expect(html).not.toContain(">Company</th>");
  expect(html).not.toContain(">Handled by</th>");
  expect(html).toContain("3 columns");
 });
 it("puts screenshot toolbar at the front while protecting advanced CRM and bulk actions",()=>{
  const workspace=source("src/components/tpo/recruiter-leads-workspace.tsx");
  const page=source("src/app/(authenticated)/tpo/recruiters/page.tsx");
  expect(workspace).toContain('aria-label="Recruiter table tools"');
  expect(workspace).toContain('title="Recruiters"');
  expect(workspace).toContain("Everyone you work with at companies");
  for(const label of ["Search recruiters","Columns","Filters","Act on all ","Export"]){
   expect(workspace).toContain(label);
  }
  expect(workspace).toContain("advancedRosterRef.current.open=true");
  expect(workspace).toContain('}>Invite</Button>');
  expect(workspace).toContain('const bulkPanel=(');
  expect(workspace).toContain('{bulkPanel}');
  expect(workspace).toContain("setSelectedIds(sortedVisible.map(lead=>lead.id))");
  expect(workspace).toContain("setCompactColumns(previous=>");
  expect(workspace).toContain('const [needsExpanded,setNeedsExpanded]=useState(false)');
  expect(workspace).toContain('focusedRecruiterId===null?sortedVisible[0]??null:');
  expect(page).not.toContain("TpoFourEntitySearch");
 });
 it("keeps advanced grid, bulk actions and recruiter detail behind the compact screenshot table",()=>{
  const roster=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(roster).toContain('<TpoRecruiterPrototypeRoster rows={sortedVisible}');
  expect(roster).toContain('data-testid="tpo.recruiter.advanced-grid"');
  expect(roster).toContain('<RecruiterTpoGrid rows={sortedVisible}');
  expect(roster).toContain('<TpoRecruiterPrototypeInspector lead={focusedLead}');
 });

});
