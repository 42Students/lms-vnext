import {expect,it} from "vitest";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {AuthorizationError} from "@/modules/permissions/policy";
it("isolates college notice transport failure without suppressing a separately loaded personal alert",async()=>{
 const college=await readOptionalLearnerAlertSource(async()=>{throw new Error("Temporary college notice outage");});
 const personal=await readOptionalLearnerAlertSource(async()=>[{id:"own-personal-alert"}]);
 expect(college.available).toBe(false);
 expect(personal).toEqual({available:true,items:[{id:"own-personal-alert"}]});
 await expect(readOptionalLearnerAlertSource(async()=>{throw new AuthorizationError("placements.read");}))
  .rejects.toBeInstanceOf(AuthorizationError);
});
