import {afterEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {runCollegeFacultyCsv,FACULTY_CSV_COLUMNS} from "@/modules/people/college-faculty-csv-service";

const {onboard,profile}=vi.hoisted(()=>({
 onboard:vi.fn(),profile:vi.fn(),
}));
vi.mock("@/modules/people/runtime",()=>({
 onboardPersonWithRuntime:onboard,
 upsertFacultyProfileWithRuntime:profile,
}));
const college="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const id="33333333-3333-4333-8333-333333333333";
const ctx:RequestContext={
 user:{id:"actor",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const header=FACULTY_CSV_COLUMNS.join(",");
const csv=(...rows:string[])=>header+"\n"+rows.join("\n");
const valid="Ada,Lovelace,9876543210,ada@example.com,professor";
afterEach(()=>{onboard.mockReset();profile.mockReset();});

describe("College faculty CSV preview, duplicate and partial-failure behavioural coverage",()=>{
 it("COL-faculty-CSV-01 preview validates real names, E.164, email, faculty type without provisioning identities",async()=>{
  const report=await runCollegeFacultyCsv(ctx,{action:"PREVIEW",csv:csv(valid)});
  expect(report).toMatchObject({preview:true,valid:1,invalid:0,structuralErrors:[]});
  expect(report.results).toMatchObject([{row:2,status:"VALID",detail:"Ready to register faculty"}]);
  expect(onboard).not.toHaveBeenCalled();
  expect(profile).not.toHaveBeenCalled();
 });

 it("COL-faculty-CSV-02 blocks malformed headers, unterminated quotes and over-500-row workloads",async()=>{
  const bad=await runCollegeFacultyCsv(ctx,{action:"PREVIEW",csv:"name,phone\nAlice,1"});
  expect(bad).toMatchObject({preview:true,structuralErrors:["INVALID_CSV_HEADER"],results:[]});
  const quoted=await runCollegeFacultyCsv(ctx,{action:"PREVIEW",csv:header+"\n\"unterminated"});
  expect(quoted).toMatchObject({preview:true,structuralErrors:["INVALID_CSV_FORMAT"],results:[]});
  const many=await runCollegeFacultyCsv(ctx,{action:"PREVIEW",
   csv:csv(...Array.from({length:501},(_,i)=>"Name,Person"+i+",9876543210,,Professor"))});
  expect(many).toMatchObject({preview:true,structuralErrors:["ROW_LIMIT_EXCEEDED"],results:[]});
  expect(onboard).not.toHaveBeenCalled();
 });

 it("COL-faculty-CSV-03 rejects duplicate contacts, invalid role type, bad cell count and invalid phone",async()=>{
  const report=await runCollegeFacultyCsv(ctx,{action:"PREVIEW",csv:csv(
   "Ada,Lovelace,9876543210,ada@example.com,Professor",
   "Grace,Hopper,+919876543210,grace@example.com,Lecturer",
   "Unknown,Type,9988776655,,Executive",
   "Missing,Number,,,Professor",
   "Extra,Column,9988776611,x@example.com,Professor,unexpected",
  )});
  expect(report.preview).toBe(true);
  expect(report.valid).toBe(1);
  expect(report.invalid).toBe(4);
  expect(report.results[1]?.detail).toContain("DUPLICATE_MOBILE_IN_FILE");
  expect(report.results[2]?.detail).toContain("FACULTY_TYPE_UNKNOWN");
  expect(report.results[3]?.detail).toContain("MOBILE_INVALID");
  expect(report.results[4]?.detail).toContain("COLUMN_COUNT_MISMATCH");
  expect(onboard).not.toHaveBeenCalled();
 });

 it("COL-faculty-CSV-04 rejects unconfirmed or forged import and suspended or wrong-role College Admin",async()=>{
  await expect(runCollegeFacultyCsv(ctx,{action:"IMPORT",csv:csv(valid)})).rejects.toBeDefined();
  await expect(runCollegeFacultyCsv(ctx,{action:"IMPORT",csv:csv(valid),confirm:false})).rejects.toBeDefined();
  await expect(runCollegeFacultyCsv(ctx,{action:"IMPORT",csv:csv(valid),confirm:true,
   collegeId:"22222222-2222-4222-8222-222222222222"})).rejects.toBeDefined();
  await expect(runCollegeFacultyCsv({...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
   {action:"PREVIEW",csv:csv(valid)})).rejects.toBeDefined();
  await expect(runCollegeFacultyCsv({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
   {action:"PREVIEW",csv:csv(valid)})).rejects.toBeDefined();
  expect(onboard).not.toHaveBeenCalled();
 });

 it("COL-faculty-CSV-05 a confirmed import uses the same College Admin tenant and exactly one faculty role",async()=>{
  onboard.mockResolvedValue({membership:{id}});
  profile.mockResolvedValue({});
  const report=await runCollegeFacultyCsv(ctx,{action:"IMPORT",csv:csv(valid),confirm:true});
  expect(report).toMatchObject({preview:false,valid:1,invalid:0,results:[{row:2,status:"IMPORTED",membershipId:id}]});
  expect(onboard).toHaveBeenCalledTimes(1);
  expect(onboard).toHaveBeenCalledWith(ctx,expect.objectContaining({
   collegeId:college,displayName:"Ada Lovelace",
   phoneE164:"+919876543210",roles:["FACULTY"],
  }));
  expect(profile).toHaveBeenCalledWith(ctx,id,expect.objectContaining({employmentType:"Professor"}));
 });

 it("COL-faculty-CSV-06 dependency failures never display raw identity exceptions or hide partial onboarding",async()=>{
  onboard.mockRejectedValueOnce(new Error("PG connection string and personal secret"));
  const first=await runCollegeFacultyCsv(ctx,{action:"IMPORT",csv:csv(valid),confirm:true});
  expect(first.results).toMatchObject([{status:"FAILED"}]);
  expect(first.results[0]?.detail).not.toContain("personal secret");
  onboard.mockResolvedValue({membership:{id}});
  profile.mockRejectedValueOnce(new Error("Sensitive provider stack"));
  const second=await runCollegeFacultyCsv(ctx,{action:"IMPORT",csv:csv(valid),confirm:true});
  expect(second.results).toMatchObject([{status:"PARTIAL",membershipId:id}]);
  expect(second.results[0]?.detail).not.toContain("Sensitive provider stack");
 });
});
