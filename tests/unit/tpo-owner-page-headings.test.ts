import {describe,expect,it} from "vitest";
import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import {getShellNavigation} from "@/components/shell/shell-model";
import type {RequestContext} from "@/modules/identity/context";
const ctx:RequestContext={user:{id:"u",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"m",organizationId:"o",collegeId:"c",status:"ACTIVE",roles:["TPO"]}};
describe("T-S1-02 owner-approved TPO headings",()=>{
 it("keeps sidebar and headings identical after Engage/Drives rename",()=>{
   const labels=getShellNavigation(ctx).map(x=>x.label);
   expect(TPO_OWNER_PAGE_COPY.recruiterLeads).toBe("Recruiter Leads");
   expect(TPO_OWNER_PAGE_COPY.placementOperations).toBe("Placement Operations");
   expect(labels).toContain(TPO_OWNER_PAGE_COPY.recruiterLeads);
   expect(labels).toContain(TPO_OWNER_PAGE_COPY.placementOperations);
   expect(labels).not.toContain("Engage");
 });
});
