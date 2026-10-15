import {expect,it} from "vitest";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {AuthorizationError} from "@/modules/permissions/policy";
it("allows own offer browsing during request-history outages without treating a missing record as no pending extension",async()=>{
 const read=await readOptionalLearnerAlertSource(async()=>{throw Error("request service unavailable");});
 expect(read).toEqual({available:false,items:[]});
 const valid=await readOptionalLearnerAlertSource(async()=>[{request:{offerId:"own",status:"PENDING"}}]);
 expect(valid.available).toBe(true);
 await expect(readOptionalLearnerAlertSource(async()=>{throw new AuthorizationError("placements.read");}))
  .rejects.toBeInstanceOf(AuthorizationError);
});
