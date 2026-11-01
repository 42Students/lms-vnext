import {describe,expect,it} from "vitest";
import {companyPlacedCount,companyHiredByYear} from "@/modules/placements/company-placed-count-policy";
import {readFileSync} from "node:fs";
const facts=[
 {membershipId:"a",offerStatus:"ISSUED",offerKind:"OFFER",countsAsPlaced:true,joiningStatus:null,joiningDate:null},
 {membershipId:"a",offerStatus:"ACCEPTED",offerKind:"OFFER",countsAsPlaced:true,joiningStatus:"JOINED",joiningDate:"2099-07-12"},
 {membershipId:"b",offerStatus:"ACCEPTED",offerKind:"OFFER",countsAsPlaced:true,joiningStatus:"JOINED",joiningDate:"2099-08-12"},
 {membershipId:"c",offerStatus:"DRAFT",offerKind:"OFFER",joiningStatus:null,joiningDate:null},
 {membershipId:"d",offerStatus:"ACCEPTED",offerKind:"INTERNSHIP",joiningStatus:null,joiningDate:null},
];
describe("TPO company placement rule and hiring history",()=>{
 it("TPO-companies-06 counts each eligible placed learner once under the recorded college policy",()=>{
  expect(companyPlacedCount(facts,"OFFER_RELEASED")).toBe(2);
  expect(companyPlacedCount(facts,"OFFER_ACCEPTED")).toBe(2);
  expect(companyPlacedCount(facts,"SELECTED")).toBeNull();
 });
 it("DB019 company placement totals preserve persisted TRUE, FALSE, and unaudited NULL",()=>{
  const template={membershipId:"new",offerStatus:"ISSUED",offerKind:"OFFER",
    joiningStatus:null,joiningDate:null};
  expect(companyPlacedCount([template],"OFFER_RELEASED")).toBeNull();
  expect(companyPlacedCount([{...template,countsAsPlaced:null}],"OFFER_ACCEPTED")).toBe(0);
  expect(companyPlacedCount([{...template,countsAsPlaced:null}],"OFFER_RELEASED")).toBeNull();
  expect(companyPlacedCount([{...template,countsAsPlaced:false}],"OFFER_RELEASED")).toBe(0);
  expect(companyPlacedCount([{...template,countsAsPlaced:true}],"OFFER_RELEASED")).toBe(1);
  expect(companyPlacedCount([...facts,{...template,countsAsPlaced:null}],"OFFER_RELEASED")).toBeNull();
  expect(companyPlacedCount([...facts,{...template,countsAsPlaced:false}],"OFFER_RELEASED")).toBe(2);
  expect(companyPlacedCount([{...template,offerKind:"LOI",countsAsPlaced:null}],"OFFER_RELEASED")).toBe(0);
  expect(companyPlacedCount([{...template,offerStatus:"DRAFT",countsAsPlaced:null}],"OFFER_RELEASED")).toBe(0);
  expect(companyPlacedCount([{...template,countsAsPlaced:null}],"SELECTED")).toBeNull();
 });
 it("TPO-companies-06 counts real joined learners by hiring year without duplicating offers",()=>{
  expect(companyHiredByYear(facts)).toEqual([{year:"2099",hired:2}]);
 });
 it("TPO-companies-06 connects the name-page strip and Companies tab to evidence",()=>{
  const s=readFileSync("src/modules/placements/tpo-company-memory-service.ts","utf8");
  expect(s).toContain("studentsHired:companyPlacedCount(driveRows,placedAt)");
  expect(s).toContain("studentsPlaced:companyPlacedCount(driveRows,placedAt)");
  expect(s).toContain("companyHiredByYear(driveRows)");
  expect(s).toContain("placementCollegeRules.countsAsPlacedAt");
  expect(s).toContain("countsAsPlaced:placementJobs.countsAsPlaced");
  expect(s).not.toContain("coalesce(${placementJobs.countsAsPlaced}, true)");
 });
});
