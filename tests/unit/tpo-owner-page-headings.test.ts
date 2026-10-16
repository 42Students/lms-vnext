import {describe,expect,it} from "vitest";
import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import {getShellNavigation} from "@/components/shell/shell-model";
import type {RequestContext} from "@/modules/identity/context";
const ctx:RequestContext={user:{id:"u",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"m",organizationId:"o",collegeId:"c",status:"ACTIVE",roles:["TPO"]}};
describe("T-S1-02 legacy TPO headings",()=>{
 it("keeps sidebar and headings identical matching the legacy Engage and Drives labels",()=>{
   const labels=getShellNavigation(ctx).map(x=>x.label);
   expect(TPO_OWNER_PAGE_COPY.recruiterLeads).toBe("Engage");
   expect(TPO_OWNER_PAGE_COPY.placementOperations).toBe("Drives");
   expect(labels).toContain(TPO_OWNER_PAGE_COPY.recruiterLeads);
   expect(labels).toContain(TPO_OWNER_PAGE_COPY.placementOperations);
   expect(labels).not.toContain("Recruiter Leads");
   expect(labels).not.toContain("Placement Operations");
   expect(labels).toContain("Audit log");
   for(const name of ["placementEligibility","team","students","calendar","settings"] as const){
     expect(labels).toContain(TPO_OWNER_PAGE_COPY[name]);
   }
   expect([TPO_OWNER_PAGE_COPY.placementEligibility,TPO_OWNER_PAGE_COPY.team,
    TPO_OWNER_PAGE_COPY.students,TPO_OWNER_PAGE_COPY.calendar,TPO_OWNER_PAGE_COPY.settings])
    .toEqual(["Placement eligibility","Team","Students","Calendar","Settings"]);
 });
});
