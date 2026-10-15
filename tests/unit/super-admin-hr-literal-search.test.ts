import {describe,it,expect} from "vitest";
import {superAdminHrLiteralSearchPattern as pattern} from "@/modules/placements/super-admin-hr-search-model";
describe("literal PostgreSQL recruiter search",()=>{
 it("preserves ordinary substrings",()=>expect(pattern("Acme")).toBe("%Acme%"));
 it("escapes SQL pattern wildcards and backslashes",()=>{
  expect(pattern("100%_")).toBe("%100\\%\\_%");
  expect(pattern("foo\\bar")).toBe("%foo\\\\bar%");
 });
 it("does not strip literal apostrophes",()=>expect(pattern("O'Reilly")).toBe("%O'Reilly%"));
});
