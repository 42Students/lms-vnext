import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {companyJobIdBatches} from "@/modules/placements/company-job-id-batches";
import {latestCompanyShareRows} from "@/modules/placements/company-share/company-history-model";

describe("TPO-companies-scale-03 bounded application, offer and share facts",()=>{
 it("partitions 1,405 historical drives into three bounded stable unique job groups",()=>{
  const ids=Array.from({length:1405},(_,i)=>"job-"+i);
  const chunks=companyJobIdBatches([...ids,"job-8","job-1404"]);
  expect(chunks.map(part=>part.length)).toEqual([500,500,405]);
  expect(chunks.flat()).toEqual(ids);
  expect(companyJobIdBatches([])).toEqual([]);
  expect(companyJobIdBatches(["x","x","y"],1)).toEqual([["x"],["y"]]);
 });
 it("rejects invalid batch sizes before issuing any query",()=>{
  for(const size of [0,501,-1,1.4,NaN,Infinity]){
   expect(()=>companyJobIdBatches(["job"],size)).toThrow(RangeError);
  }
 });
 it("merges per-chunk newest 100 into the globally correct page, regardless of chunk order",()=>{
  const rows=Array.from({length:1200},(_,index)=>({
   id:"share-"+String(index).padStart(4,"0"),
   createdAt:new Date(Date.UTC(2099,0,1,0,0,index)),
   jobId:"job-"+(index%1200),
  }));
  const shuffled=[...rows.slice(0,400),...rows.slice(800),...rows.slice(400,800)];
  const snapshot=shuffled.slice();
  const merged=latestCompanyShareRows(shuffled);
  expect(merged).toHaveLength(100);
  expect(merged[0]?.id).toBe("share-1199");
  expect(merged.at(-1)?.id).toBe("share-1100");
  expect(shuffled).toEqual(snapshot);
 });
 it("uses stable id tie-break to keep an auditable latest-page result",()=>{
  const when=new Date("2099-01-01T00:00:00Z");
  const merged=latestCompanyShareRows([
   {id:"a",createdAt:when},{id:"c",createdAt:when},{id:"b",createdAt:when},
  ],2);
  expect(merged.map(row=>row.id)).toEqual(["c","b"]);
  expect(()=>latestCompanyShareRows([],101)).toThrow(RangeError);
 });
 it("wires limited SQL predicates and newest-100 across both private employer count and share readers",()=>{
  const source=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
  const counts=source("src/modules/placements/tpo-company-drive-counts-service.ts");
  const history=source("src/modules/placements/company-share/company-history-service.ts");
  expect(counts).toContain("for(const jobBatch of companyJobIdBatches(ids))");
  expect(counts.indexOf("for(const id of ids)counts.set")).toBeLessThan(
   counts.indexOf("for(const jobBatch of companyJobIdBatches(ids))"));
  expect(counts.match(/for\(const id of ids\)counts\.set/g)).toHaveLength(1);
  expect(counts.match(/inArray\(placementApplications\.jobId,jobBatch\)/g)).toHaveLength(2);
  expect(history).toContain("mapTpoBulkBounded(companyJobIdBatches(jobIds)");
  expect(history).toContain("latestCompanyShareRows(chunks.flat())");
  expect(history).toContain("desc(placementCompanyApplicantShares.id)");
  expect(history).toContain("eq(placementJobs.collegeId,placementCompanyApplicantShares.collegeId)");
 });
});
