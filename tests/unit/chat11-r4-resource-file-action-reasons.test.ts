import {expect,it} from "vitest";
import {resourceFileActionState} from "@/modules/projects/resource-file-action-state-model";
import type {ResourceFileUiScope} from "@/modules/projects/resource-file-permission-model";
const scope:ResourceFileUiScope={viewer:"MENTOR",projectAccessGranted:true,moduleEnabled:true,collegeMatches:true,projectStatus:"ACTIVE",resourceActive:true,storageReady:true,fileVerified:true};
it("reports useful permission and unavailable reasons without exposing other tenants",()=>{
 expect(resourceFileActionState(scope,"UPLOAD")).toEqual({enabled:true,reason:null});
 expect(resourceFileActionState({...scope,viewer:"LEARNER"},"DELETE").reason).toMatch(/authorized/);
 expect(resourceFileActionState({...scope,collegeMatches:false},"LIST").reason).not.toContain("college");
 expect(resourceFileActionState({...scope,projectStatus:"ARCHIVED"},"DELETE").reason).toMatch(/read-only/);
});
it("distinguishes unverified download from missing storage",()=>{
 expect(resourceFileActionState({...scope,fileVerified:false},"DOWNLOAD").reason).toMatch(/not been cleared/);
 expect(resourceFileActionState({...scope,storageReady:false},"UPLOAD").reason).toMatch(/not available/);
});
