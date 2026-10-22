import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const page=(file:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/tracker/mine",file),"utf8");

describe("UX-tracker-mine-chat15-01",()=>{
 it("UX-tracker-mine-01 redirects disabled users and renders unavailable, error and empty states",()=>{
  const s=page("page.tsx");
  for(const part of ['context.user.platformStatus!=="ACTIVE"', 'redirect("/dashboard")',
    "trackerAdminRuntimeEnabled()", '<Banner tone="warning">', '<ErrorState title="Could not load reports"',
    "Reports are temporarily unavailable. Try again soon.",
    "We could not load your reports.", "You have not reported any issues yet.",
    "encodeURIComponent(item.publicId)", 'href="/tracker"', "<PageHeader",
    "listMyTrackerReports(context)"])expect(s).toContain(part);
  expect(s).not.toMatch(/error\.(message|stack)/);
 });
 it("UX-tracker-mine-publicId-01 validates the ID and scopes loading to signed-in reporter",()=>{
  const s=page("[publicId]/page.tsx");
  for(const part of ['context.user.platformStatus!=="ACTIVE"',
    "trackerPublicIdSchema.safeParse(canonical).success", "notFound()",
    "getMyTrackerReport(context,publicId)", "trackerAdminRuntimeEnabled()",
    '<Banner tone="warning">', 'href="/tracker/mine"',"timeZone:\"Asia/Kolkata\"",
    "<PageHeader"])expect(s).toContain(part);
  expect(s).not.toMatch(/error\.(message|stack)/);
 });
});
