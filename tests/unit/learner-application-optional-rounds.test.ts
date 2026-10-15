import {expect,it} from "vitest";
import {AuthorizationError} from "@/modules/permissions/policy";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
it("keeps saved applications visible if optional rounds fail but honors membership denial",async()=>{
 expect(await readOptionalLearnerPlacementSource(async()=>({rounds:[{id:"own"}]}))).toEqual({available:true,value:{rounds:[{id:"own"}]}});
 expect(await readOptionalLearnerPlacementSource(async()=>{throw new Error("rounds db failed")})).toEqual({available:false,value:null});
 await expect(readOptionalLearnerPlacementSource(async()=>{throw new AuthorizationError("placements.read")})).rejects.toBeInstanceOf(AuthorizationError);
});
