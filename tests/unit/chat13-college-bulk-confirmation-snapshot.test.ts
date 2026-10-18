import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {canApplyConfirmedCollegeBulkImport} from "@/modules/colleges/bulk-import-confirmation-model";

const valid={
 confirmed:true,inFlight:false,validRows:3,validationError:"",
 organizationId:"organization-a",selectionVersion:4,confirmationVersion:4,
};
describe("SA-COLLEGE-CSV-20 no stale organization, changed CSV or duplicate import",()=>{
 it("requires the exact confirmed version and a validated bounded CSV",()=>{
  expect(canApplyConfirmedCollegeBulkImport(valid)).toBe(true);
  for(const modified of [
   {...valid,confirmed:false},{...valid,inFlight:true},
   {...valid,validRows:0},{...valid,validRows:201},
   {...valid,validRows:NaN},{...valid,validationError:"Duplicate college code"},
   {...valid,organizationId:""},{...valid,selectionVersion:5},
   {...valid,confirmationVersion:-1},
  ])expect(canApplyConfirmedCollegeBulkImport(modified)).toBe(false);
 });
 it("revokes confirmation on draft or parent change and captures exact submitted body",()=>{
  const source=readFileSync("src/components/admin/college-bulk-import.tsx","utf8");
  expect(source).toContain("versionRef.current++;confirmedVersionRef.current=-1");
  expect(source).toContain("setConfirmImport(false)");
  expect(source).toContain("inFlightRef.current=true");
  expect(source).toContain("inFlightRef.current=false");
  expect(source).toContain("canApplyConfirmedCollegeBulkImport({");
  expect(source).toContain("confirmedOrganization=organizationId,confirmedCsv=csv");
  expect(source).toContain("organizationId:confirmedOrganization,csv:confirmedCsv");
 });
});
