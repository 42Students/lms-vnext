import {expect,it} from "vitest";
import {resourceFileUiAllowed, type ResourceFileUiScope} from "@/modules/projects/resource-file-permission-model";
const scope:ResourceFileUiScope={viewer:"MENTOR",projectAccessGranted:true,moduleEnabled:true,collegeMatches:true,projectStatus:"ACTIVE",resourceActive:true,storageReady:true,fileVerified:true};
it("allows assigned Mentors to manage files but never learner mutations",()=>{
 expect(resourceFileUiAllowed(scope,"UPLOAD")).toBe(true);
 expect(resourceFileUiAllowed(scope,"DELETE")).toBe(true);
 expect(resourceFileUiAllowed({...scope,viewer:"LEARNER"},"LIST")).toBe(true);
 expect(resourceFileUiAllowed({...scope,viewer:"LEARNER"},"UPLOAD")).toBe(false);
});
it("fails closed for cross-tenant, ended assignment, disabled module and archive",()=>{
 for(const change of [{collegeMatches:false},{projectAccessGranted:false},{moduleEnabled:false},{resourceActive:false}])
  expect(resourceFileUiAllowed({...scope,...change},"LIST")).toBe(false);
 expect(resourceFileUiAllowed({...scope,projectStatus:"ARCHIVED"},"DELETE")).toBe(false);
 expect(resourceFileUiAllowed({...scope,storageReady:false},"UPLOAD")).toBe(false);
 expect(resourceFileUiAllowed({...scope,fileVerified:false},"DOWNLOAD")).toBe(false);
});

it("requires server-granted project scope even for a college administrator",()=>{
 expect(resourceFileUiAllowed({...scope,viewer:"ADMIN",projectAccessGranted:true},"UPLOAD")).toBe(true);
 expect(resourceFileUiAllowed({...scope,viewer:"ADMIN",projectAccessGranted:false},"UPLOAD")).toBe(false);
});
