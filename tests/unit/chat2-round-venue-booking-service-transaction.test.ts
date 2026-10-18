import {describe,expect,it,vi} from "vitest";
import {requireAvailableRoundVenue} from "@/modules/placements/round-venue-booking-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const roundId="22222222-2222-4222-8222-222222222222";
const at=new Date("2099-11-02T04:30:00Z");

function fakeTx(competitors:{scheduledAt:Date|null;durationMinutes:number|null}[]){
  const order:string[]=[];
  const execute=vi.fn(async()=>{order.push("lock");return {rows:[]};});
  const limit=vi.fn(async()=>{order.push("query");return competitors;});
  const chain={
    from(){return this;},innerJoin(){return this;},where(){return this;},limit,
  };
  const select=vi.fn(()=>chain);
  return {tx:{execute,select} as unknown as Parameters<typeof requireAvailableRoundVenue>[0],
    execute,select,limit,order};
}
const input=(extra:Partial<{venue:string;start:Date;durationMinutes:number|null}>={})=>({
  collegeId,roundId,venue:"  LAB-1  ",start:at,durationMinutes:60 as number|null,
  ...extra,
});
describe("chat-2 shared college venue guard direct transaction semantics",()=>{
  it("TPO-round-venue-01 refuses malformed times, empty rooms and durations before advisory locks",async()=>{
    for(const candidate of [
      input({venue:" "}),input({durationMinutes:null}),input({durationMinutes:0}),
      input({durationMinutes:1441}),input({durationMinutes:1.4}),
      input({start:new Date("invalid")}),
    ]){
      const mock=fakeTx([]);
      await expect(requireAvailableRoundVenue(mock.tx,candidate))
        .rejects.toMatchObject({code:"PLACEMENT_ROUND_INVALID_TRANSITION"});
      expect(mock.execute).not.toHaveBeenCalled();
      expect(mock.select).not.toHaveBeenCalled();
    }
  });

  it("TPO-round-venue-02 acquires college/room transaction advisory lock before reading rivals",async()=>{
    const mock=fakeTx([]);
    await expect(requireAvailableRoundVenue(mock.tx,input())).resolves.toBeUndefined();
    expect(mock.execute).toHaveBeenCalledTimes(1);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(1001);
    expect(mock.order).toEqual(["lock","query"]);
  });

  it("TPO-round-venue-03 refuses a conflicting 45-minute interview and accepts exactly touching edges",async()=>{
    const overlapping=fakeTx([{scheduledAt:new Date("2099-11-02T05:00:00Z"),durationMinutes:45}]);
    await expect(requireAvailableRoundVenue(overlapping.tx,input()))
      .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
    const adjacent=fakeTx([{scheduledAt:new Date("2099-11-02T05:30:00Z"),durationMinutes:45}]);
    await expect(requireAvailableRoundVenue(adjacent.tx,input())).resolves.toBeUndefined();
    const earlier=fakeTx([{scheduledAt:new Date("2099-11-02T03:30:00Z"),durationMinutes:60}]);
    await expect(requireAvailableRoundVenue(earlier.tx,input())).resolves.toBeUndefined();
  });

  it("TPO-round-venue-04 fails closed on missing rival start and duration instead of assuming room availability",async()=>{
    for(const competitors of [
      [{scheduledAt:null,durationMinutes:60}],
      [{scheduledAt:new Date("2099-11-02T05:00:00Z"),durationMinutes:null}],
      [{scheduledAt:new Date("invalid"),durationMinutes:60}],
      [{scheduledAt:new Date("2099-11-02T05:00:00Z"),durationMinutes:-1}],
    ]){
      const mock=fakeTx(competitors);
      await expect(requireAvailableRoundVenue(mock.tx,input()))
        .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
    }
  });

  it("TPO-round-venue-05 treats overflowed rival lists as conflict, never silently truncating",async()=>{
    const mock=fakeTx(Array.from({length:1001},()=>({
      scheduledAt:new Date("2099-11-02T12:00:00Z"),durationMinutes:30,
    })));
    await expect(requireAvailableRoundVenue(mock.tx,input()))
      .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
  });
});
