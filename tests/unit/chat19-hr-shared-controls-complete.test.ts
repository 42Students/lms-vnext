import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const hrComponents=["hr-drive-draft-form","hr-notification-read-button","hr-recruiter-bell","hr-unsent-drive-alert","recruiter-applicant-review-drawer","recruiter-conversation-live-refresh","recruiter-conversation-read-control","recruiter-conversation-reply-form","recruiter-decision-read-button","recruiter-designation-editor","recruiter-display-name-editor","recruiter-drive-focus-refresh","recruiter-notification-bell","recruiter-private-rating-editor","recruiter-profile-access","recruiter-profile-details-editor","recruiter-request-cancel-button","recruiter-request-feedback","recruiter-round-inline-editor"] as const;
const hrPages=["activity","calendar","colleges","company","company/reports","conversations","conversations/[threadId]","drives","drives/[jobId]/interview-slots","drives/[jobId]/messages","drives/[jobId]/rounds/editor","drives/[jobId]/rounds/editor/remove/[roundId]","drives/new","drives/proposals","drives/recorded-outside","home","messages","notifications","placements","placements/jobs/[jobId]","profile","round-results"] as const;
const source=(path:string)=>readFileSync(path,"utf8");

/** Source-only anti-regression checks; runtime/CI execution belongs to integration. */
describe("NORTH-STAR chat-19 shared HR controls",()=>{
 it("leaves no raw interactive HTML controls across the 19 recruiter components",()=>{
  for(const name of hrComponents){
   const content=source("src/components/hr/"+name+".tsx");
   expect(content,name).not.toMatch(/<(?:button|input|select|textarea)\b/);
  }
 });
 it("keeps all 22 canonical HR pages on shared interactive controls",()=>{
  for(const name of hrPages){
   const content=source("src/app/(authenticated)/hr/"+name+"/page.tsx");
   expect(content,name).not.toMatch(/<(?:button|select|textarea)\b/);
   for(const input of content.match(/<input\b[^>]*\/>/g)??[]){
    expect(input,name).toContain('type="hidden"');
   }
  }
 });
 it("also uses shared form controls inside recruiter placement-specific subviews",()=>{
  for(const component of ["applicant-notes-panel","recruiter-result-controls","recruiter-resume-download"]){
   const content=source("src/components/placements/"+component+".tsx");
   expect(content,component).not.toMatch(/<(?:button|input|select|textarea)\b/);
  }
 });
 it("keeps complete Select and Button closing tag names in edited authoring flows",()=>{
  for(const name of ["hr-drive-draft-form","recruiter-round-inline-editor","recruiter-private-rating-editor"]){
   const content=source("src/components/hr/"+name+".tsx");
   for(const tag of ["Select","Button"]){
    const opens=(content.match(new RegExp("<"+tag+"\\b","g"))??[]).length;
    const closes=(content.match(new RegExp("</"+tag+">","g"))??[]).length;
    expect(opens,name+" "+tag).toBe(closes);
   }
   expect(content,name).not.toMatch(/<\/Select\s*\n/);
  }
 });
});
