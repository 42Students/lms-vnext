import {describe,it,expect} from "vitest";
import {verificationSqlSections} from "@/modules/verification/queue-kind";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
describe("College verification kind filters precede the large queue cap",()=>{
 it("constrains SQL to exactly the requested DB04 profile section",()=>{
  expect(verificationSqlSections(undefined)).toEqual(["EDUCATION","IDENTITY"]);
  expect(verificationSqlSections("EDUCATION")).toEqual(["EDUCATION"]);
  expect(verificationSqlSections("IDENTITY")).toEqual(["IDENTITY"]);
  expect(verificationQueueFilters.safeParse({kind:"PAYMENTS"}).success).toBe(false);
 });
});
