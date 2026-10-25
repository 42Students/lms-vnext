import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {placementOfferActionSchema} from "@/modules/placements/validation";

const offer=readFileSync("src/app/api/placements/offers/[offerId]/actions/route.ts","utf8");
const eligibility=readFileSync("src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts","utf8");

describe("legacy placement decision compatibility without coercion",()=>{
 it("rejects malformed or conflicting offer accept decisions",()=>{
  expect(offer).toContain("legacyOfferResponseSchema.parse(source)");
  expect(offer).toContain("accept:z.boolean()");
  expect(offer).toContain("z.strictObject");
  expect(placementOfferActionSchema.safeParse({action:"ACCEPT"}).success).toBe(true);
  expect(placementOfferActionSchema.safeParse({action:"ACCEPT",accept:"true"}).success).toBe(false);
 });
 it("distinguishes legacy include, exclude and explicit clear",()=>{
  expect(eligibility).toContain('record["override"]!==null&&typeof record["override"]!=="boolean"');
  expect(eligibility).toContain('record["override"]===null');
  expect(eligibility).toContain('record["override"]?"INCLUDE":"EXCLUDE"');
  expect(eligibility).toContain("revokeEligibilityOverride(context,jobId,membershipId,{");
  expect(eligibility).toContain("clear.data.expectedOverrideId");
  expect(eligibility).toContain("clear.data.reason");
  expect(eligibility).toContain("setEligibilityOverride(context,jobId,membershipId,parsed.data)");
 });
});
