import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({db:vi.fn(),select:vi.fn(),scope:vi.fn(),tx:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:state.scope}));
import {
 listPlacementRounds,getPlacementRound,createPlacementRound,updatePlacementRound,
 actOnPlacementRound,getTpoRoundReorderReadiness,reorderPlacementRounds,
} from "@/modules/placements/round-service";

const uuid="00000000-0000-4000-8000-000000000001";
const actor={user:{id:"tpo",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:"college-a",organizationId:"org-a",roles:["TPO"],status:"ACTIVE"},
} as unknown as RequestContext;
const job={id:uuid,collegeId:"college-a",status:"PUBLISHED"};
const round={id:uuid,jobId:uuid,status:"PENDING",kind:"TEST",name:"Technical"};
const query=(row:unknown)=>({
 from(){return this;},innerJoin(){return this;},where(){return this;},
 limit(){return Promise.resolve([row]);},
});
const services=[
 {name:"round list",bad:()=>listPlacementRounds(actor,"../other"),
  denied:()=>listPlacementRounds(actor,uuid),row:job},
 {name:"round detail",bad:()=>getPlacementRound(actor,"../other"),
  denied:()=>getPlacementRound(actor,uuid),row:{job,round}},
 {name:"round create",bad:()=>createPlacementRound(actor,"../other",{kind:"TEST",name:"Technical"}),
  denied:()=>createPlacementRound(actor,uuid,{kind:"TEST",name:"Technical"}),row:job},
 {name:"round update",bad:()=>updatePlacementRound(actor,"../other",{name:"New technical round"}),
  denied:()=>updatePlacementRound(actor,uuid,{name:"New technical round"}),row:{job,round}},
 {name:"round lifecycle",bad:()=>actOnPlacementRound(actor,"../other",{action:"CANCEL",reason:"Unable to book venue"}),
  denied:()=>actOnPlacementRound(actor,uuid,{action:"CANCEL",reason:"Unable to book venue"}),row:{job,round}},
 {name:"reorder readiness",bad:()=>getTpoRoundReorderReadiness(actor,"../other"),
  denied:()=>getTpoRoundReorderReadiness(actor,uuid),row:job},
 {name:"round reorder",bad:()=>reorderPlacementRounds(actor,"../other",{roundIds:[uuid]}),
  denied:()=>reorderPlacementRounds(actor,uuid,{roundIds:[uuid]}),row:job},
] as const;
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.db.mockReturnValue({select:state.select,transaction:state.tx});
});
describe("TPO-BREAK-round-service-12 malformed IDs and authorization-denied write barrier",()=>{
 for(const spec of services){
  it(`refuses encoded or malformed IDs before a DB read for ${spec.name}`,async()=>{
   await expect(spec.bad()).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
   expect(state.scope).not.toHaveBeenCalled();
   expect(state.tx).not.toHaveBeenCalled();
  });
  it(`performs no mutation and never enumerates another college after denied scope in ${spec.name}`,async()=>{
   state.select.mockImplementation(()=>query(spec.row));
   state.scope.mockRejectedValueOnce(new Error("TPO_COLLEGE_SCOPE_DENIED"));
   await expect(spec.denied()).rejects.toThrow("TPO_COLLEGE_SCOPE_DENIED");
   expect(state.scope).toHaveBeenCalledWith(actor,"college-a");
   expect(state.tx).not.toHaveBeenCalled();
   expect(state.select).toHaveBeenCalledTimes(1);
  });
 }
 it("rejects duplicate reorder IDs and client tenant overrides before touching persisted rows",async()=>{
  await expect(reorderPlacementRounds(actor,uuid,{roundIds:[uuid,uuid]})).rejects.toThrow();
  await expect(createPlacementRound(actor,uuid,{kind:"TEST",name:"Technical",collegeId:"other"} as never))
   .rejects.toThrow();
  await expect(updatePlacementRound(actor,uuid,{})).rejects.toThrow();
  expect(state.db).not.toHaveBeenCalled();
  expect(state.tx).not.toHaveBeenCalled();
 });
});
