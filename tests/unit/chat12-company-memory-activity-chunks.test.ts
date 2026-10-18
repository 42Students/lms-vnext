import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {companyJobIdBatches} from "@/modules/placements/company-job-id-batches";
import {latestTpoCompanyLeadActivities} from "@/modules/placements/tpo-company-memory-activity-model";
import {mapTpoBulkBounded} from "@/modules/placements/tpo-bulk-bounded-execution";

const log=(i:number)=>({
 id:"activity-"+String(i).padStart(5,"0"),
 createdAt:new Date(Date.UTC(2099,0,1,0,0,i)),
 leadId:"lead-"+i,
});
describe("TPO-companies-history-scale-04 large employer private timeline and logins",()=>{
 it("globally selects newest 200 across 1203 lead IDs, not just the first SQL batch",()=>{
  const ids=Array.from({length:1203},(_,i)=>"lead-"+i);
  expect(companyJobIdBatches(ids).map(row=>row.length)).toEqual([500,500,203]);
  const batches=[
   Array.from({length:500},(_,i)=>log(i)).reverse().slice(0,200),
   Array.from({length:500},(_,i)=>log(i+500)).reverse().slice(0,200),
   Array.from({length:203},(_,i)=>log(i+1000)).reverse().slice(0,200),
  ];
  const newest=latestTpoCompanyLeadActivities(batches);
  expect(newest).toHaveLength(200);
  expect(newest[0]?.id).toBe(log(1202).id);
  expect(newest.at(-1)?.id).toBe(log(1003).id);
 });
 it("sorts same-time activities by stable id, leaves input untouched and rejects oversized pages",()=>{
  const when=new Date("2099-01-01T00:00:00Z");
  const batch=[{id:"a",createdAt:when},{id:"c",createdAt:when},{id:"b",createdAt:when}];
  const rows=latestTpoCompanyLeadActivities([batch],2);
  expect(rows.map(row=>row.id)).toEqual(["c","b"]);
  expect(batch.map(row=>row.id)).toEqual(["a","c","b"]);
  for(const invalid of [0,-1,201,1.4,NaN])expect(()=>
   latestTpoCompanyLeadActivities([batch],invalid)).toThrow(RangeError);
 });
 it("bounds concurrently loaded timelines to six independent SQL queries",async()=>{
  let busy=0,high=0;
  const outcome=await mapTpoBulkBounded(companyJobIdBatches(
   Array.from({length:4000},(_,i)=>"lead-"+i)),async chunk=>{
    busy++;high=Math.max(busy,high);
    await Promise.resolve();
    busy--;
    return chunk.length;
   },6);
  expect(outcome).toEqual([500,500,500,500,500,500,500,500]);
  expect(high).toBe(6);
 });
 it("both lead history and recruiter login queries are chunked within the authorized company memory",()=>{
  const src=readFileSync(new URL("../../src/modules/placements/tpo-company-memory-service.ts",import.meta.url),"utf8");
  expect(src).toContain("mapTpoBulkBounded(companyJobIdBatches(leadIds)");
  expect(src).toContain("mapTpoBulkBounded(companyJobIdBatches(recruiterIds)");
  expect(src).toContain("latestTpoCompanyLeadActivities(activityBatches)");
  expect(src).toContain("latest:max(identityDeviceSessions.createdAt)");
  expect(src).toContain("eq(placementTpoLeadActivities.collegeId,rows.collegeId)");
  expect(src).toContain("await requireTpoBatchActor(context)");
 });
});
