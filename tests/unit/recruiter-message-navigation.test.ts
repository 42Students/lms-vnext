import {expect,it} from "vitest";
import {getShellNavigation,qualifyDuplicateLabels} from "@/components/shell/shell-model";
import type {RequestContext} from "@/modules/identity/context";

it("REC-calendar-messages-profile-08: recruiter Messages keeps main shell href (/hr/messages); /recruiter/messages serves the conversations inbox",()=>{
 const context={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},membership:null,
  recruiter:{status:"ACTIVE",companyId:"co",grants:[{collegeId:"college",companyRelationshipId:"rel"}]}} as unknown as RequestContext;
 const rows=getShellNavigation(context);
 const messages=rows.find(item=>item.label==="Messages");
 expect(messages?.href).toBe("/hr/messages");
});

it("REC-calendar-messages-profile-08: multi-role recruiter Messages stays distinguishable",()=>{
 const entries=qualifyDuplicateLabels([
  {label:"Messages",href:"/tpo/messages",shortLabel:"M"},
  {label:"Messages",href:"/recruiter/messages",shortLabel:"M"},
 ]);
 expect(entries.map(item=>item.label)).toEqual(["Messages · Placements","Messages · Recruiting"]);
});
