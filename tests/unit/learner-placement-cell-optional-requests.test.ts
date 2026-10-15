import {expect,it} from "vitest";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
import {AuthorizationError} from "@/modules/permissions/policy";
it("does not treat failed request workspace as an empty history permitting duplicate extensions",async()=>{
 expect(await readOptionalLearnerPlacementSource(async()=>{throw Error("requests unavailable")})).toEqual({available:false,value:null});
 expect(await readOptionalLearnerPlacementSource(async()=>({requests:[{id:"owned"}],offers:[],rounds:[]}))).toEqual({available:true,value:{requests:[{id:"owned"}],offers:[],rounds:[]}});
 await expect(readOptionalLearnerPlacementSource(async()=>{throw new AuthorizationError("placements.read")})).rejects.toBeInstanceOf(AuthorizationError);
});
