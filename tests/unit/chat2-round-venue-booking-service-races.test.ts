import {beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {requireAvailableRoundVenue} from "@/modules/placements/round-venue-booking-service";

const state=vi.hoisted(()=>({execute:vi.fn(),limit:vi.fn()}));
const start=new Date("2099-07-03T04:00:00.000Z");
const request={collegeId:"college-a",roundId:"round-a",venue:" Main Hall ",start,durationMinutes:30};
const tx=()=>({
 execute:state.execute,
 select:()=>({from:()=>({innerJoin:()=>({where:()=>({limit:state.limit})})})}),
});
beforeEach(()=>{
 vi.clearAllMocks();
 state.execute.mockResolvedValue(undefined);
 state.limit.mockResolvedValue([]);
});

describe("TPO-drive-workspace-44 serializable interview venue scheduling",()=>{
 it("TPO-drive-workspace-44 denies malformed windows before taking any advisory lock",async()=>{
  const invalid=[
   {...request,venue:" "},
   {...request,durationMinutes:null},
   {...request,durationMinutes:-1},
   {...request,durationMinutes:0},
   {...request,durationMinutes:0.5},
   {...request,durationMinutes:1441},
   {...request,durationMinutes:Number.NaN},
   {...request,durationMinutes:Infinity},
   {...request,start:new Date("invalid")},
  ];
  for(const candidate of invalid){
   await expect(requireAvailableRoundVenue(tx() as never,candidate)).rejects.toMatchObject({
    code:"PLACEMENT_ROUND_INVALID_TRANSITION",
   });
  }
  expect(state.execute).not.toHaveBeenCalled();
  expect(state.limit).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-44 obtains a transaction advisory lock BEFORE looking up conflicting rounds",async()=>{
  await expect(requireAvailableRoundVenue(tx() as never,request)).resolves.toBeUndefined();
  expect(state.execute).toHaveBeenCalledTimes(1);
  expect(state.limit).toHaveBeenCalledWith(1001);
  expect(state.execute.mock.invocationCallOrder[0]).toBeLessThan(state.limit.mock.invocationCallOrder[0]);
 });
 it("TPO-drive-workspace-44 accepts exactly touching windows and rejects overlapping rounds",async()=>{
  state.limit.mockResolvedValue([{scheduledAt:new Date("2099-07-03T03:30:00.000Z"),durationMinutes:30}]);
  await expect(requireAvailableRoundVenue(tx() as never,request)).resolves.toBeUndefined();
  state.limit.mockResolvedValueOnce([{scheduledAt:new Date("2099-07-03T03:31:00.000Z"),durationMinutes:30}]);
  await expect(requireAvailableRoundVenue(tx() as never,request))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
 });
 it("TPO-drive-workspace-44 fails closed on missing competitor time, duration or unbounded occupancy inventory",async()=>{
  for(const rows of [
   [{scheduledAt:null,durationMinutes:30}],
   [{scheduledAt:start,durationMinutes:null}],
   [{scheduledAt:start,durationMinutes:1.5}],
   Array.from({length:1001},(_,i)=>({scheduledAt:new Date("2099-07-05T00:00:00Z"),durationMinutes:i===0?30:15})),
  ]){
   state.limit.mockResolvedValueOnce(rows);
   await expect(requireAvailableRoundVenue(tx() as never,request))
    .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
  }
 });
});
