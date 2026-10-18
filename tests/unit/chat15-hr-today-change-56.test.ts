import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),rows:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));

import {listRecruiterTodayChangeRequests}
 from "@/modules/placements/hr-today-change-request-service";
import {countRecruiterAnswerableDriveRequests}
 from "@/modules/placements/hr-recruiter-open-change-counts-service";

const college="123e4567-e89b-42d3-a456-426614174001";
const job="123e4567-e89b-42d3-a456-426614174002";
function query(rows:unknown[]){
 const chain={
  from(){return this;},innerJoin(){return this;},where(){return this;},
  orderBy(){return this;},limit(){return Promise.resolve(rows);},
  groupBy(){return Promise.resolve(rows);},
 };
 return chain;
}
describe("HR-TODAY-CHANGE-56 employer Today and drive request counts exclude archived jobs",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[];
  mocks.select.mockImplementation(()=>query(mocks.rows));
  mocks.getDb.mockReturnValue({select:mocks.select});
 });
 it("empty authorized job scope never queries another employer's open requests",async()=>{
  await expect(listRecruiterTodayChangeRequests(college,[])).resolves.toEqual([]);
  await expect(countRecruiterAnswerableDriveRequests(college,[])).resolves.toEqual({});
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("both SQL queries independently require exact college, live job, non-archive and COMPANY action",()=>{
  for(const path of [
   "src/modules/placements/hr-today-change-request-service.ts",
   "src/modules/placements/hr-recruiter-open-change-counts-service.ts",
  ]){
   const source=readFileSync(path,"utf8");
   for(const clause of [
    "inArray(placementDriveChangeRequests.jobId,ids)",
    "eq(placementJobs.collegeId,collegeId)",
    'inArray(placementJobs.status,["PUBLISHED","CLOSED"])',
    "isNull(placementJobs.archivedAt)",
    'eq(placementDriveChangeRequests.status,"OPEN")',
    'eq(placementDriveChangeRequests.targetParty,"COMPANY")',
   ])expect(source).toContain(clause);
  }
 });
 it("returns a bounded authorized latest-open-request queue with job metadata",async()=>{
  const row={id:"change-1",jobId:job,jobTitle:"Engineer",field:"CTC",
   createdAt:new Date("2099-01-01T00:00:00Z")};
  mocks.rows=[row];
  await expect(listRecruiterTodayChangeRequests(college,[job,job]))
   .resolves.toEqual([row]);
  expect(mocks.select).toHaveBeenCalledTimes(1);
  expect(readFileSync("src/modules/placements/hr-today-change-request-service.ts","utf8"))
   .toContain(".limit(20)");
 });
 it("groups only scoped COMPANY open request counts by authorized job",async()=>{
  mocks.rows=[{jobId:job,count:3}];
  await expect(countRecruiterAnswerableDriveRequests(college,[job,job]))
   .resolves.toEqual({[job]:3});
  expect(mocks.select).toHaveBeenCalledTimes(1);
  expect(readFileSync("src/modules/placements/hr-recruiter-open-change-counts-service.ts","utf8"))
   .toContain(".groupBy(placementDriveChangeRequests.jobId)");
 });
});
