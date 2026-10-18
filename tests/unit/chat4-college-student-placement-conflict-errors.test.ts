import {afterEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {placeImportedLearnerInSection} from "@/modules/people/college-student-import-placement";
import {AcademicsServiceError} from "@/modules/academics/errors";
import {apiErrorResponse} from "@/lib/api-error";

const mocks=vi.hoisted(()=>({transaction:vi.fn(),actingCollege:vi.fn()}));
vi.mock("@/db/client",()=>({
 getDb:()=>({transaction:mocks.transaction}),
}));
vi.mock("@/modules/permissions/acting-college",()=>({
 resolveActingCollege:mocks.actingCollege,
}));
const college="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const enrollment="22222222-2222-4222-8222-222222222222";
const section="33333333-3333-4333-8333-333333333333";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
afterEach(()=>{mocks.transaction.mockReset();mocks.actingCollege.mockReset();});
describe("College student placement double-submit and friendly error mapping",()=>{
 it("COL-student-import-ERROR-01 PostgreSQL duplicate period index becomes a typed 409, never an internal 500",async()=>{
  mocks.actingCollege.mockResolvedValue(actor.membership);
  mocks.transaction.mockRejectedValueOnce({
   code:"23505",constraint:"section_enrollments_active_period_uq",
  });
  const error=await placeImportedLearnerInSection(actor,enrollment,section)
   .catch((cause:unknown)=>cause);
  expect(error).toBeInstanceOf(AcademicsServiceError);
  expect(error).toMatchObject({code:"ALREADY_PLACED_IN_PERIOD"});
  const response=apiErrorResponse(error);
  expect(response.status).toBe(409);
  const body=await response.json();
  expect(body.error).toBe("ALREADY_PLACED_IN_PERIOD");
  expect(body.message).toBeTruthy();
  expect(JSON.stringify(body)).not.toContain("section_enrollments_active_period_uq");
  expect(mocks.transaction).toHaveBeenCalledOnce();
 });
 it("COL-student-import-ERROR-02 database outages and unrelated SQL errors still propagate for outage handling",async()=>{
  mocks.actingCollege.mockResolvedValue(actor.membership);
  const original=new Error("CONNECTION_FAILED");
  mocks.transaction.mockRejectedValueOnce(original);
  await expect(placeImportedLearnerInSection(actor,enrollment,section))
   .rejects.toBe(original);
 });
 it("COL-student-import-ERROR-03 expected class invalid, mismatched, occupied and duplicate errors all return friendly conflicts",async()=>{
  for(const code of [
   "CLASS_UNAVAILABLE","CLASS_BATCH_MISMATCH",
   "CLASS_FULL","ALREADY_PLACED_IN_PERIOD",
  ] as const){
   const error=new AcademicsServiceError(code);
   const response=apiErrorResponse(error);
   expect(response.status).toBe(409);
   const body=await response.json();
   expect(body.error).toBe(code);
   expect(body.message).toBeTruthy();
   expect(body.requestId).toBeTruthy();
  }
 });
});