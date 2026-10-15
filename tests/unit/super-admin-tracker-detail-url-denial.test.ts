import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("tracker detail public ID guard",()=>{
 it("validates public IDs before touching DB10 readiness or service",()=>{
  const code=readFileSync("src/app/(authenticated)/tracker/issues/[publicId]/page.tsx","utf8");
  expect(code).toContain("trackerPublicIdSchema.safeParse(publicId).success) notFound()");
  expect(code.indexOf("trackerPublicIdSchema.safeParse(publicId)")).toBeLessThan(code.indexOf("trackerAdminRuntimeEnabled()"));
 });
 it("reuses the guarded page for audit finding details",()=>{
  const code=readFileSync("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx","utf8");
  expect(code).toContain("TrackerIssueDetailPage params={params}");
 });
});
