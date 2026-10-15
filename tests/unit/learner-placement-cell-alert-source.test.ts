import {it,expect} from "vitest";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {AuthorizationError} from "@/modules/permissions/policy";
it("isolates personal alert read failures from offers without hiding authorization denial",async()=>{
 expect(await readOptionalLearnerAlertSource(async()=>{throw Error("notifications temporarily unavailable")})).toEqual({available:false,items:[]});
 expect(await readOptionalLearnerAlertSource(async()=>[{id:"owned"}])).toEqual({available:true,items:[{id:"owned"}]});
 await expect(readOptionalLearnerAlertSource(async()=>{throw new AuthorizationError("placements.read")})).rejects.toBeInstanceOf(AuthorizationError);
});
