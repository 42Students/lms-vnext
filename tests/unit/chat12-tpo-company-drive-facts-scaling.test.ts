import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {groupTpoDriveFactsByJob,tpoDriveFactIdChunks} from "@/modules/placements/tpo-company-memory-service";
import {deriveCompanyDriveFacts} from "@/modules/placements/company-drive-facts-policy";

describe("TPO-companies-scale-01 company directory batching and correct evidence partition",()=>{
 it("partitions many offers without merging other relationships or dropping duplicate job facts",()=>{
  const rows=Array.from({length:1200},(_,index)=>({
   jobId:"job-"+(index%120),jobStatus:"PUBLISHED",archivedAt:null,
   offerStatus:index%10===0?"ACCEPTED":null,
   joiningStatus:index%20===0?"JOINED":null,
   sequence:index,
  }));
  const buckets=groupTpoDriveFactsByJob(rows);
  expect(buckets.size).toBe(120);
  expect(buckets.get("job-0")).toHaveLength(10);
  expect(buckets.get("job-2")?.map(x=>x.sequence)).toEqual([2,122,242,362,482,602,722,842,962,1082]);
  const employerA=buckets.get("job-0")??[];
  const employerB=buckets.get("job-2")??[];
  expect(deriveCompanyDriveFacts(employerA)).toMatchObject({plannedDriveCount:1,acceptedOfferDriveCount:1});
  expect(deriveCompanyDriveFacts(employerB)).toMatchObject({plannedDriveCount:1,acceptedOfferDriveCount:0});
  expect(buckets.get("foreign-college-job")).toBeUndefined();
  expect(rows).toHaveLength(1200);
 });
 it("never invents evidence for absent job IDs or mutates upstream read results",()=>{
  const source=[{jobId:"a",offerStatus:"ACCEPTED"},{jobId:"b",offerStatus:"ISSUED"}];
  const original=source.map(x=>({...x}));
  const buckets=groupTpoDriveFactsByJob(source);
  expect(buckets.get("a")).toEqual([source[0]]);
  expect(buckets.get("b")).toEqual([source[1]]);
  expect(buckets.get("c")).toBeUndefined();
  expect(source).toEqual(original);
  expect(groupTpoDriveFactsByJob([])).toEqual(new Map());
 });
 it("TPO-companies-scale-02 caps SQL predicates at 500 unique drive IDs while preserving order",()=>{
  const ids=Array.from({length:1205},(_,i)=>"job-"+i);
  const batches=tpoDriveFactIdChunks([...ids,"job-1","job-1","job-1204"]);
  expect(batches.map(batch=>batch.length)).toEqual([500,500,205]);
  expect(batches.flat()).toEqual(ids);
  expect(new Set(batches.flat()).size).toBe(1205);
  expect(tpoDriveFactIdChunks([])).toEqual([]);
 });
 it("wires only one drive-facts read into the college directory, not one per company",()=>{
  const source=readFileSync(new URL("../../src/modules/placements/tpo-company-memory-service.ts",import.meta.url),"utf8");
  const start=source.indexOf("export async function listTpoCompanies(");
  const end=source.indexOf("export async function getTpoCompanyMemory(",start);
  const list=source.slice(start,end);
  expect(list).toContain("groupTpoDriveFactsByJob(await loadDriveFacts(");
  expect(list).toContain("rows.jobs.map(row=>row.job.id)");
  expect(list).toContain("group.jobs.flatMap(row=>factsByJob.get(row.job.id)??[])");
  expect(list.match(/loadDriveFacts\(/g)).toHaveLength(1);
 });
});
