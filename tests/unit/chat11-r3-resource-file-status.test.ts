import {expect,it} from "vitest";
import {resourceFileBadge} from "@/modules/projects/resource-file-status-model";
it("does not imply pending or unverified bytes are downloadable",()=>{
 for(const status of ["QUEUED","UPLOADING","VERIFYING","QUARANTINED","FAILED","DELETED"] as const)
  expect(resourceFileBadge(status).downloadable).toBe(false);
});
it("indicates explicitly verified files as potentially viewable, subject to backend authorization",()=>{
 expect(resourceFileBadge("READY")).toMatchObject({label:"Available",downloadable:true,tone:"success"});
 expect(resourceFileBadge("QUARANTINED").detail).toMatch(/cannot be opened/);
});
