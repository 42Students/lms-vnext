import {describe,it,expect} from "vitest";
import {tpoVerificationQuerySchema} from "@/modules/verification/tpo-queue-server-model";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO Verification large scoped queue",()=>{
 it("TPO-requests-verification-23 defaults to the oldest 1000 authorized students and discloses the cap",()=>{
  const query=tpoVerificationQuerySchema.parse({});
  expect(query.pageSize).toBe(1000);
  expect(tpoVerificationQuerySchema.parse({pageSize:"1000"}).pageSize).toBe(1000);
  expect(tpoVerificationQuerySchema.safeParse({pageSize:1001}).success).toBe(false);
  const service=src("src/modules/placements/tpo-verification-queue-service.ts");
  expect(service).toContain('query?.tab==="WAITING"?asc(profileVerifications.submittedAt)');
  expect(service).toContain("const totals=await getDb().select({");
  const page=src("src/app/(authenticated)/tpo/verification/page.tsx");
  expect(page).toContain("Showing the first 1,000 students in this view");
  expect(page).toContain('value="1000"');
 });
});
