import {expect,it} from "vitest";
import {resourceFileUiAllowed, type ResourceFileUiScope} from "@/modules/projects/resource-file-permission-model";
const scope:ResourceFileUiScope={viewer:"MENTOR",assignedToProject:true,moduleEnabled:true,collegeMatches:true,projectStatus:"ACTIVE",resourceActive:true,storageReady:true,fileVerified:true};
it("allows assigned Mentors to manage files but never learner mutations",()=>{
 expect(resourceFileUiAllowed(scope,"UPLOAD")).toBe(true);
 expect(resourceFileUiAllowed(scope,"DELETE")).toBe(true);
 expect(resourceFileUiAllowed({...scope,viewer:"LEARNER"},"LIST")).toBe(true);
 expect(resourceFileUiAllowed({...scope,viewer:"LEARNER"},"UPLOAD")).toBe(false);
});
it("fails closed for cross-tenant, ended assignment, disabled module and archive",()=>{
 for(const change of [{collegeMatches:false},{assignedToProject:false},{moduleEnabled:false},{resourceActive:false}])
  expect(resourceFileUiAllowed({...scope,...change},"LIST")).toBe(false);
 expect(resourceFileUiAllowed({...scope,projectStatus:"ARCHIVED"},"DELETE")).toBe(false);
 expect(resourceFileUiAllowed({...scope,storageReady:false},"UPLOAD")).toBe(false);
 expect(resourceFileUiAllowed({...scope,fileVerified:false},"DOWNLOAD")).toBe(false);
});
