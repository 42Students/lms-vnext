import {describe,expect,it} from "vitest";
import {isShareableJob} from "@/modules/placements/company-share/manage-service";
describe("company applicant share owner scope",()=>{
 it("permits only visible same-college published or closed drives",()=>{
  expect(isShareableJob("a","a","PUBLISHED")).toBe(true);
  expect(isShareableJob("a","a","CLOSED")).toBe(true);
  expect(isShareableJob("a","b","PUBLISHED")).toBe(false);
  expect(isShareableJob("a",null,"PUBLISHED")).toBe(false);
  expect(isShareableJob("a","a","DRAFT")).toBe(false);
  expect(isShareableJob("a","a","CANCELLED")).toBe(false);
 });
});
