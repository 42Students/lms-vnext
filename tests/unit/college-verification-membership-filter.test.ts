import {describe,it,expect} from "vitest";
import {collegeLearnerVerificationHref} from "@/modules/verification/admin-links";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
describe("College verification cross-directory learner lookup",()=>{
 const id="00000000-0000-4000-8000-000000000149";
 it("allows only exact membership UUIDs, never caller-controlled colleges",()=>{
  expect(verificationQueueFilters.parse({membershipId:id}).membershipId).toBe(id);
  expect(collegeLearnerVerificationHref(id)).toBe("/college/verification?membershipId="+id);
  expect(verificationQueueFilters.safeParse({membershipId:"../../admin"}).success).toBe(false);
  expect(()=>collegeLearnerVerificationHref("../admin")).toThrow();
  expect(parseCollegeVerificationPageQuery({collegeId:id,membershipId:id}).success).toBe(false);
  expect(parseCollegeVerificationPageQuery({membershipId:[id,id]}).success).toBe(false);
 });
});
