import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({college:vi.fn(),actor:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:state.college,
 requireTpoJobActor:state.actor,
}));
import {getTpoInterviewSlotWorkspace,mutateTpoInterviewSlots}
 from "@/modules/placements/tpo-interview-slot-service";
import {rescheduleTpoInterview}
 from "@/modules/placements/tpo-interview-reschedule-service";
import {getTpoRoundApplyPreview}
 from "@/modules/placements/tpo-round-apply-service";

const jobId="00000000-0000-4000-8000-000000000001";
const roundId="00000000-0000-4000-8000-000000000002";
const actor={user:{id:"user",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:"college-a",organizationId:"organization-a",
  status:"ACTIVE",roles:["TPO"]}} as unknown as RequestContext;
const cases=[
 {name:"interview workspace",run:()=>getTpoInterviewSlotWorkspace(actor,jobId,roundId)},
 {name:"slot mutation",run:()=>mutateTpoInterviewSlots(actor,jobId,roundId,{action:"CLEAR_AVAILABLE",confirmed:true})},
 {name:"round reschedule",run:()=>rescheduleTpoInterview(actor,roundId,{confirmed:true})},
 {name:"round apply preview",run:()=>getTpoRoundApplyPreview(actor,jobId,roundId)},
] as const;

beforeEach(()=>{for(const mock of Object.values(state))mock.mockReset();});

describe("TPO-BREAK-service-denial-09 service entrypoint role/tenant/session guards",()=>{
 for(const spec of cases){
  it(`refuses deactivated/foreign tenant before opening a DB for ${spec.name}`,async()=>{
   state.college.mockRejectedValueOnce(new Error("PLACEMENTS_TPO_SCOPE_DENIED"));
   await expect(spec.run()).rejects.toThrow("PLACEMENTS_TPO_SCOPE_DENIED");
   expect(state.college).toHaveBeenCalledTimes(1);
   expect(state.db).not.toHaveBeenCalled();
   expect(state.actor).not.toHaveBeenCalled();
  });
  it(`rejects arbitrary URL IDs before reading another tenant in ${spec.name}`,async()=>{
   state.college.mockResolvedValue("college-a");
   const run=spec.name==="round reschedule"
    ?()=>rescheduleTpoInterview(actor,"not-a-round",{confirmed:true})
    :spec.name==="round apply preview"
     ?()=>getTpoRoundApplyPreview(actor,"not-a-job",roundId)
     :spec.name==="slot mutation"
      ?()=>mutateTpoInterviewSlots(actor,"not-a-job",roundId,{action:"CLEAR_AVAILABLE",confirmed:true})
      :()=>getTpoInterviewSlotWorkspace(actor,"not-a-job",roundId);
   await expect(run()).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
  });
 }
});
