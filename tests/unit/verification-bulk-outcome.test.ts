import {describe,it,expect} from "vitest";
import {summarizeBulkReviews,bulkReviewFailureLabel} from "@/modules/verification/bulk-outcome";
describe("staff bulk review outcomes",()=>{
 it("counts partial success rather than treating 200 as all successful",()=>{
  const rows=[
   {learnerMembershipId:"a",section:"EDUCATION" as const,result:"VERIFIED" as const},
   {learnerMembershipId:"b",section:"IDENTITY" as const,result:"STALE_VERSION" as const},
  ];
  expect(summarizeBulkReviews(rows)).toEqual({attempted:2,succeeded:1,failed:1});
  expect(bulkReviewFailureLabel("STALE_VERSION")).toContain("refresh");
 });
});
