import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({db:vi.fn(),select:vi.fn(),ready:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/company-share/readiness",()=>({
 companyShareTablesReady:mock.ready,
}));
import {getCompanyDriveCounts} from "@/modules/placements/tpo-company-drive-counts-service";
import {listCompanyShareHistory} from "@/modules/placements/company-share/company-history-service";
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ids=Array.from({length:1201},(_,i)=>"job-"+i);
const chain=(rows:readonly unknown[])=>({
 from(){return this;},innerJoin(){return this;},where(){return this;},
 groupBy:async()=>rows,
 orderBy(){return this;},limit:async()=>rows,
});
describe("TPO-companies-scale-03 real service return values under bounded SQL clients",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.ready.mockResolvedValue(true);
  mock.db.mockReturnValue({select:mock.select});
 });
 it("combines first, middle and final count chunks without reinitializing prior results",async()=>{
  let n=0;
  const replies=[
   [{jobId:"job-0",total:4}],[{jobId:"job-0",total:2}],
   [{jobId:"job-700",total:3}],[{jobId:"job-700",total:1}],
   [{jobId:"job-1200",total:1}],[{jobId:"job-1200",total:1}],
  ];
  mock.select.mockImplementation(()=>chain(replies[n++]??[]));
  const result=await getCompanyDriveCounts(COLLEGE,ids);
  expect(n).toBe(6);
  expect(result.size).toBe(1201);
  expect(result.get("job-0")).toEqual({applied:4,offers:2});
  expect(result.get("job-700")).toEqual({applied:3,offers:1});
  expect(result.get("job-1200")).toEqual({applied:1,offers:1});
  expect(result.get("job-900")).toEqual({applied:0,offers:0});
 });
 it("company shares from the final chunk can outrank the first chunk's latest history",async()=>{
  let n=0;
  const rows=[
   [{id:"aaa",jobId:"job-1",jobTitle:"Old",createdAt:new Date("2099-01-01T00:00:00Z"),
     revokedAt:null,expiresAt:null,selectedCount:1}],
   [{id:"zzz",jobId:"job-550",jobTitle:"New",createdAt:new Date("2099-12-01T00:00:00Z"),
     revokedAt:null,expiresAt:null,selectedCount:2}],
   [{id:"bbb",jobId:"job-1150",jobTitle:"Middle",createdAt:new Date("2099-06-01T00:00:00Z"),
     revokedAt:null,expiresAt:null,selectedCount:3}],
  ];
  mock.select.mockImplementation(()=>chain(rows[n++]??[]));
  const result=await listCompanyShareHistory(COLLEGE,ids);
  expect(result.ready).toBe(true);
  expect(n).toBe(3);
  expect(result.items.map(row=>row.id)).toEqual(["zzz","bbb","aaa"]);
 });
 it("missing share storage is explicitly unavailable, not reported as zero company shares",async()=>{
  mock.ready.mockResolvedValue(false);
  await expect(listCompanyShareHistory(COLLEGE,ids)).resolves.toEqual({
   ready:false,items:[],
  });
  expect(mock.select).not.toHaveBeenCalled();
 });
 it("empty employer history makes zero SQL calls",async()=>{
  await expect(getCompanyDriveCounts(COLLEGE,[])).resolves.toEqual(new Map());
  await expect(listCompanyShareHistory(COLLEGE,[])).resolves.toEqual({ready:true,items:[]});
  expect(mock.db).not.toHaveBeenCalled();
 });
});
