import {expect,it} from "vitest";
import {mentorLatestDeliveryVersion} from "@/modules/projects/mentor-workspace-evidence-model";
it("uses highest persisted delivery version rather than received array order",()=>{
 expect(mentorLatestDeliveryVersion([])).toBeNull();
 expect(mentorLatestDeliveryVersion([
  {version:3,status:"APPROVED"},{version:1,status:"SUBMITTED"},{version:2,status:"DRAFT"},
 ])).toEqual({version:3,status:"APPROVED"});
});
