import {describe,it,expect} from "vitest";
import {tpoApplicationUrlError} from "@/modules/placements/tpo-applications-url-guard";
describe("TPO pipeline ambiguous query denial",()=>{
 it("refuses repeated stages and page numbers",()=>{
  expect(tpoApplicationUrlError({stage:["ALL","REJECTED"]})).toMatch(/Repeated/);
  expect(tpoApplicationUrlError({page:["1","3"]})).toMatch(/Repeated/);
 });
 it("accepts normal typed scalar filters and columns",()=>{
  expect(tpoApplicationUrlError({stage:"ALL",columns:"student,role"})).toBeNull();
 });
});
