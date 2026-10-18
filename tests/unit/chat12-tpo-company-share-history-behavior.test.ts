import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const mock=vi.hoisted(()=>({db:vi.fn(),ready:vi.fn(),select:vi.fn(),items:[] as unknown[]}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/company-share/readiness",()=>({companyShareTablesReady:mock.ready}));
import {listCompanyShareHistory}
 from "@/modules/placements/company-share/company-history-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const JOB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OTHER="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
describe("TPO-companies-11 historical applicant sharing is scoped, bounded and honest",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();mock.items=[];
  mock.ready.mockResolvedValue(true);
  mock.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   orderBy(){return this;},limit(){return Promise.resolve(mock.items);},
  }));
  mock.db.mockReturnValue({select:mock.select});
 });
 it("does no database work for zero authorized company drive IDs",async()=>{
  await expect(listCompanyShareHistory(COLLEGE,[]))
   .resolves.toEqual({ready:true,items:[]});
  expect(mock.ready).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("missing registered share tables produce explicit unavailability, never fabricated empty history",async()=>{
  mock.ready.mockResolvedValue(false);
  await expect(listCompanyShareHistory(COLLEGE,[JOB]))
   .resolves.toEqual({ready:false,items:[]});
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("returns real historical share and revocation facts only after tables pass readiness",async()=>{
  const history=[{id:OTHER,jobId:JOB,jobTitle:"Engineer",
   createdAt:new Date("2026-10-01T11:00:00Z"),
   revokedAt:new Date("2026-10-11T11:00:00Z"),
   expiresAt:new Date("2026-10-18T11:00:00Z"),selectedCount:2}];
  mock.items=history;
  expect(await listCompanyShareHistory(COLLEGE,[JOB]))
   .toEqual({ready:true,items:history});
  expect(mock.select).toHaveBeenCalledTimes(1);
 });
 it("reader joins share college to job college and caps history at 100 rows",()=>{
  const source=readFileSync(resolve(process.cwd(),
   "src/modules/placements/company-share/company-history-service.ts"),"utf8");
  expect(source).toContain("eq(placementJobs.collegeId,placementCompanyApplicantShares.collegeId)");
  expect(source).toContain("eq(placementCompanyApplicantShares.collegeId,collegeId)");
  expect(source).toContain("inArray(placementCompanyApplicantShares.jobId,[...jobIds])");
  expect(source).toContain("where sel.share_id = ");
  expect(source).toContain(".limit(100)");
  expect(source).toContain("orderBy(desc(placementCompanyApplicantShares.createdAt))");
 });
});
