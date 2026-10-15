import {describe,it,expect} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {orderVerificationQueue} from "@/modules/verification/queue-order";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("Verification learner-name order",()=>{
 const rows=[{learnerMembershipId:"z",learnerName:"zoe",section:"EDUCATION" as const,submittedAt:new Date("2020-01-01T00:00:00Z")},
  {learnerMembershipId:"a",learnerName:"Alice",section:"IDENTITY" as const,submittedAt:new Date("2030-01-01T00:00:00Z")}];
 it("sorts case-insensitive names consistently before paging",()=>{
  expect(orderVerificationQueue(rows,"NAME").map(row=>row.learnerName)).toEqual(["Alice","zoe"]);
  expect(orderVerificationQueue(rows,"OLDEST")[0]?.learnerName).toBe("zoe");
  expect(verificationQueueFilters.parse({sort:"NAME"}).sort).toBe("NAME");
  expect(parseVerificationExportQuery(new URLSearchParams("sort=NAME")).sort).toBe("NAME");
 });
});
