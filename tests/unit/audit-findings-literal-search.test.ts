import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync("src/modules/bug-tracker/admin-service.ts","utf8");
describe("scoped DB10 tracker substring filtering",()=>{
 it("treats wildcard metacharacters as literal search terms",()=>{
  expect(source).toContain("position(${term}::text in lower(");
  expect(source).not.toContain("const pattern =");
  expect(source).toContain("const scope = adminScopeCondition(context)");
 });
});