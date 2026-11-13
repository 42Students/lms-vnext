import { CACHE_PIN } from "../support/cache-pin";
import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
describe("college bulk review route protection",()=>{
 it("checks request origin before parsing body and delegates to the authorized writer",()=>{
  const source=readFileSync(resolve(process.cwd(),"src/app/api/college/verification/bulk-review/route.ts"),"utf8");
  expect(source).toMatch(/export (?:async function|const) POST\b/);
  // route() checks the origin before it authenticates or runs the handler; the legacy form checked it inline before parsing.
  if(source.includes("isSameOriginRequest(request)"))expect(source.indexOf("if(!isSameOriginRequest(request))")).toBeLessThan(source.indexOf("await request.json()"));
  else expect(source).toContain('from "@/security/route"');
  expect(source).toMatch(/reviewCollegeVerificationBulk\(context,\s*await (?:request\.json\(\)|boundedRequestJson\(request[^)]*\))\)/);
  expect(source).toMatch(CACHE_PIN);
 });
});
