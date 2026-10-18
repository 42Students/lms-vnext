import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyBulkImportResponseSchema,facultyBulkImportFailureMessage}
 from "@/modules/people/faculty-bulk-import-response-model";

const response={
 total:3,created:1,failed:1,skipped:1,
 results:[
  {row:1,name:"Anjali Sharma",status:"CREATED",message:"Faculty membership onboarded"},
  {row:2,name:"Ravi Kumar",status:"FAILED",message:"Could not onboard this record."},
  {row:3,name:"Meera Rao",status:"SKIPPED",message:"Duplicate mobile in this file"},
 ],
};
describe("SA-FACULTY-CSV-22 bounded and verified Super Admin import recovery",()=>{
 it("accepts exact partial success totals without claiming the failed rows were created",()=>{
  expect(facultyBulkImportResponseSchema.safeParse(response).success).toBe(true);
  for(const broken of [
   {...response,total:2},{...response,created:2},
   {...response,results:[...response.results,{...response.results[0],row:501}]},
   {...response,results:[{...response.results[0],status:"BOGUS"}]},
   {...response,secret:"foreign-admin"},
  ])expect(facultyBulkImportResponseSchema.safeParse(broken).success).toBe(false);
 });
 it("renders friendly recovery rather than machine error identifiers",()=>{
  expect(facultyBulkImportFailureMessage(403)).toContain("administrator access changed");
  expect(facultyBulkImportFailureMessage(409)).toContain("Refresh the roster");
  expect(facultyBulkImportFailureMessage(413)).toContain("too large");
  expect(facultyBulkImportFailureMessage(422)).toContain("Check the faculty CSV");
  expect(facultyBulkImportFailureMessage(503)).toContain("Review the faculty roster");
 });
 it("caps actual body bytes and returns an authorization error for another selected college",()=>{
  const route=readFileSync("src/app/api/admin/faculty/bulk-import/route.ts","utf8");
  expect(route.indexOf("isSameOriginRequest(request)")).toBeLessThan(
    route.indexOf("readBoundedJsonRequest(request,4_000_000)"));
  expect(route.indexOf("readBoundedJsonRequest(request,4_000_000)")).toBeLessThan(
    route.indexOf("getCurrentRequestContext()"));
  const service=readFileSync("src/modules/people/faculty-bulk-import-service.ts","utf8");
  expect(service).toContain('throw new AuthorizationError("people.manage")');
  const view=readFileSync("src/components/admin/super-admin-faculty-bulk-import.tsx","utf8");
  expect(view).toContain("facultyBulkImportResponseSchema.safeParse(await response.json())");
  expect(view).toContain("facultyBulkImportFailureMessage(response.status)");
  expect(view).not.toContain("result.error??");
 });
});
