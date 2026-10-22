import {beforeEach,describe,expect,it,vi} from "vitest";

const db=vi.hoisted(()=>({getDb:vi.fn(),select:vi.fn(),rows:[] as unknown[][]}));
vi.mock("@/db/client",()=>({getDb:db.getDb}));

import {listRecruiterTodayOfferActions}
 from "@/modules/placements/hr-today-offer-actions-service";
import {listRecruiterTodayRoundsNeedingSlots}
 from "@/modules/placements/hr-today-open-slots-service";
import {listRecruiterTodayChangeRequests}
 from "@/modules/placements/hr-today-change-request-service";

function query(rows:unknown[]){
 const b={
  from(){return this;},innerJoin(){return this;},where(){return this;},
  orderBy(){return this;},groupBy(){return Promise.resolve(rows);},
  limit(){return Promise.resolve(rows);},
  then(onFulfilled:(value:unknown[])=>unknown,onRejected?:(error:unknown)=>unknown){
   return Promise.resolve(rows).then(onFulfilled,onRejected);
  },
 };
 return b;
}
const college="11111111-1111-4111-8111-111111111111";
const job="22222222-2222-4222-8222-222222222222";

describe("HR-BREAK-today-service-01: college-scoped dashboard query branches",()=>{
 beforeEach(()=>{
  db.rows=[];
  db.select.mockReset();
  db.getDb.mockReset();
  db.select.mockImplementation(()=>query(db.rows.shift()??[]));
  db.getDb.mockReturnValue({select:db.select});
 });
 it("empty authorized job set returns empty in every Today service without querying a tenant table",async()=>{
  expect(await listRecruiterTodayOfferActions(college,[])).toEqual([]);
  expect(await listRecruiterTodayRoundsNeedingSlots(college,[],new Date())).toEqual([]);
  expect(await listRecruiterTodayChangeRequests(college,[])).toEqual([]);
  expect(db.getDb).not.toHaveBeenCalled();
 });
 it("Today offers counts only nonempty persisted followup rows and coerces driver counts",async()=>{
  db.rows=[[{jobId:job,jobTitle:"Engineer",status:"ISSUED",count:"2"},
    {jobId:job,jobTitle:"Engineer",status:"ACCEPTED",count:0}]];
  const result=await listRecruiterTodayOfferActions(college,[job,job]);
  expect(db.getDb).toHaveBeenCalledTimes(1);
  expect(result).toEqual([{jobId:job,jobTitle:"Engineer",status:"ISSUED",count:2}]);
 });
 it("Today interview slots exclude already offered/booked rounds and preserve proposed rounds needing action",async()=>{
  const now=new Date("2026-10-18T00:00:00Z");
  db.rows=[
   [{id:"offered",jobId:job,jobTitle:"Engineer",name:"Round 1",scheduledAt:new Date("2026-11-01")},
    {id:"proposal",jobId:job,jobTitle:"Engineer",name:"Round 2",scheduledAt:new Date("2026-11-02")},
    {id:"missing",jobId:job,jobTitle:"Engineer",name:"Round 3",scheduledAt:new Date("2026-11-03")}],
   [], // Mock rowset for the NOT EXISTS subquery, which is evaluated by SQL.
   [{roundId:"offered",status:"OFFERED"},{roundId:"proposal",status:"PROPOSED"}],
  ];
  const result=await listRecruiterTodayRoundsNeedingSlots(college,[job],now);
  expect(result.map(x=>[x.id,x.needsOffer])).toEqual([["proposal",true],["missing",false]]);
  expect(db.select).toHaveBeenCalledTimes(3);
 });
 it("Today change requests returns assigned company-facing records, not a placeholder total",async()=>{
  const visible={id:"req1",jobId:job,jobTitle:"Engineer",field:"APPLICATION_DEADLINE",createdAt:new Date()};
  db.rows=[[visible]];
  const result=await listRecruiterTodayChangeRequests(college,[job]);
  expect(result).toEqual([visible]);
  expect(db.select).toHaveBeenCalledTimes(1);
 });
});