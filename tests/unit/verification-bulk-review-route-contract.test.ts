import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
describe("college bulk review route protection",()=>{
 it("checks request origin before parsing body and delegates to the authorized writer",()=>{
  const source=readFileSync(resolve(process.cwd(),"src/app/api/college/verification/bulk-review/route.ts"),"utf8");
  expect(source).toContain("export async function POST");
  expect(source.indexOf("if(!isSameOriginRequest(request))")).toBeLessThan(source.indexOf("await request.json()"));
  expect(source).toContain("reviewCollegeVerificationBulk(context,await request.json())");
  expect(source).toContain("private, no-store");
 });
});
