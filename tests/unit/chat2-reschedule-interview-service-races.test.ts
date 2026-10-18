import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 college:vi.fn(),actor:vi.fn(),venue:vi.fn(),getDb:vi.fn(),
 selectRows:[] as unknown[],updateRows:[] as unknown[],
 updated:[] as unknown[],inserted:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.getDb}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:state.college,requireTpoJobActor:state.actor,
}));
vi.mock("@/modules/placements/round-venue-booking-service",()=>({
 requireAvailableRoundVenue:state.venue,
}));
import {rescheduleTpoInterview} from "@/modules/placements/tpo-interview-reschedule-service";

const college="00000000-0000-4000-8000-000000000001";
const jobId="00000000-0000-4000-8000-000000000002";
const roundId="00000000-0000-4000-8000-000000000003";
const version="2099-07-01T00:00:00.000Z";
const actor:RequestContext={
 user:{id:"staff",identityUid:"staff-auth",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
};
const valid={confirmed:true,expectedUpdatedAt:version,localDateTime:"2099-07-04T10:30",
 mode:"VIRTUAL",meetingUrl:"https://meet.example.test/interview",
 reason:"Candidate requested a carefully reviewed change in schedule"} as const;
const storedRound={
 id:roundId,kind:"INTERVIEW",status:"SCHEDULED",updatedAt:new Date(version),
 durationMinutes:30,scheduledAt:new Date("2099-07-03T03:30:00.000Z"),
 name:"Technical round",
};
const job={id:jobId,status:"PUBLISHED"};

function db(){
 const tx={
  select:vi.fn(()=>({
   from:()=>({innerJoin:()=>({where:()=>({
    for:()=>({limit:async()=>state.selectRows}),
   })})}),
  })),
  update:vi.fn(()=>({
   set:(changes:unknown)=>{state.updated.push(changes);return {
    where:()=>({returning:async()=>state.updateRows}),
   };},
  })),
  insert:vi.fn(()=>({
   values:async(values:unknown)=>{state.inserted.push(values);},
  })),
 };
 state.getDb.mockReturnValue({transaction:(fn:(value:typeof tx)=>Promise<unknown>)=>fn(tx)});
 return tx;
}
beforeEach(()=>{
 vi.clearAllMocks();state.selectRows=[];state.updateRows=[];state.updated.length=0;state.inserted.length=0;
 state.college.mockResolvedValue(college);state.actor.mockResolvedValue(undefined);
 state.venue.mockResolvedValue(undefined);db();
});

describe("TPO-drive-workspace-44 reschedule transaction and tenant race boundaries",()=>{
 it("TPO-drive-workspace-44 denies revoked/wrong-college identity before any interview row is read",async()=>{
  state.college.mockRejectedValueOnce(new Error("COLLEGE_SCOPE_DENIED"));
  await expect(rescheduleTpoInterview(actor,roundId,valid)).rejects.toThrow("COLLEGE_SCOPE_DENIED");
  expect(state.getDb).not.toHaveBeenCalled();
  expect(state.inserted).toHaveLength(0);
 });
 it("TPO-drive-workspace-44 rejects bad IDs, forged body selectors, insecure URLs and missing confirmation",async()=>{
  for(const input of [
   {round:roundId,payload:{...valid,confirmed:false}},
   {round:roundId,payload:{...valid,companyId:jobId}},
   {round:roundId,payload:{...valid,meetingUrl:"http://meet.example.test/interview"}},
   {round:roundId,payload:{...valid,meetingUrl:"https://staff:secret@meet.example.test"}},
   {round:roundId,payload:{...valid,expectedUpdatedAt:"yesterday"}},
   {round:roundId,payload:{...valid,reason:"short"}},
   {round:"../other",payload:valid},
  ])await expect(rescheduleTpoInterview(actor,input.round,input.payload)).rejects.toThrow();
  expect(state.getDb).not.toHaveBeenCalled();
  expect(state.inserted).toHaveLength(0);
 });
 it("TPO-drive-workspace-44 denies missing, ended and non-interview rows without writes or side effects",async()=>{
  for(const rows of [
   [],
   [{round:{...storedRound,status:"COMPLETED"},job}],
   [{round:{...storedRound,kind:"TALK"},job}],
   [{round:storedRound,job:{...job,status:"CLOSED"}}],
  ]){
   state.selectRows=rows;
   await expect(rescheduleTpoInterview(actor,roundId,valid)).rejects.toThrow();
   expect(state.updated).toHaveLength(0);
   expect(state.inserted).toHaveLength(0);
  }
 });
 it("TPO-drive-workspace-44 refuses stale tabs before scheduling or auditing anything",async()=>{
  state.selectRows=[{round:{...storedRound,updatedAt:new Date("2099-07-01T00:00:01Z")},job}];
  await expect(rescheduleTpoInterview(actor,roundId,valid))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
  expect(state.updated).toHaveLength(0);
  expect(state.inserted).toHaveLength(0);
 });
 it("TPO-drive-workspace-44 emits no success audit after a CAS version conflict",async()=>{
  state.selectRows=[{round:storedRound,job}];state.updateRows=[];
  await expect(rescheduleTpoInterview(actor,roundId,valid))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
  expect(state.updated).toHaveLength(1);
  expect(state.inserted).toHaveLength(0);
 });
 it("TPO-drive-workspace-44 records one round event and one college activity for a successful reschedule",async()=>{
  state.selectRows=[{round:storedRound,job}];
  state.updateRows=[{id:roundId,scheduledAt:new Date("2099-07-04T05:00:00Z"),
   updatedAt:new Date("2099-07-01T00:00:01.000Z"),venue:null,
   meetingUrl:valid.meetingUrl}];
  const result=await rescheduleTpoInterview(actor,roundId,valid);
  expect(result).toEqual({
   id:roundId,scheduledAt:"2099-07-04T05:00:00.000Z",
   updatedAt:"2099-07-01T00:00:01.000Z",
  });
  expect(state.venue).not.toHaveBeenCalled();
  expect(state.inserted).toHaveLength(2);
  expect(state.inserted[0]).toMatchObject({roundId,eventType:"RESCHEDULED",actorUserId:actor.user.id});
  expect(state.inserted[1]).toMatchObject({
   collegeId:college,eventType:"PLACEMENTS_TPO_INTERVIEW_RESCHEDULED",
   actorMembershipId:actor.membership!.id,
  });
 });
 it("TPO-drive-workspace-44 checks real venue availability and never writes after a conflict",async()=>{
  state.selectRows=[{round:storedRound,job}];
  state.venue.mockRejectedValueOnce(new Error("VENUE_OCCUPIED"));
  await expect(rescheduleTpoInterview(actor,roundId,{
   ...valid,mode:"ON_CAMPUS",meetingUrl:undefined,venue:"Main Hall",
  })).rejects.toThrow("VENUE_OCCUPIED");
  expect(state.venue).toHaveBeenCalledTimes(1);
  expect(state.updated).toHaveLength(0);
  expect(state.inserted).toHaveLength(0);
 });
});
