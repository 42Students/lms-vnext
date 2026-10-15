import {it,expect} from "vitest";
import {AuthorizationError} from "@/modules/permissions/policy";
import {readOptionalLearnerAlertSource as read} from "@/modules/placements/learner-optional-alert-source-model";
it("preserves college notices when personal feed is down but never masks authorization denial",async()=>{
 expect(await read(async()=>[{id:"a"}])).toEqual({available:true,items:[{id:"a"}]});
 expect(await read(async()=>{throw new Error("DB unavailable")})).toEqual({available:false,items:[]});
 await expect(read(async()=>{throw new AuthorizationError("placements.read")})).rejects.toBeInstanceOf(AuthorizationError);
});
