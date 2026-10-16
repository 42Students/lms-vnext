import {describe,expect,it} from "vitest";
import {tpoDriveLifecycleSchema} from "@/modules/placements/tpo-drive-lifecycle-model";
describe("TPO-drive-workspace-13 publish reach confirmation",()=>{
 it("cannot request email silently and requires confirmation",()=>{
  const valid={action:"PUBLISH",expectedStatus:"DRAFT",confirmed:true,
    reason:"Reviewed reach and readiness",notifyByEmail:false};
  expect(tpoDriveLifecycleSchema.safeParse(valid).success).toBe(true);
  expect(tpoDriveLifecycleSchema.safeParse({...valid,confirmed:false}).success).toBe(false);
 });
});