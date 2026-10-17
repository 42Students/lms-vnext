import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {defaultTpoDriveView} from "@/modules/placements/tpo-drive-lifecycle-list-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 Drives round 4",()=>{
 it("TPO-drives-04 review-first default and persistent badge counts",()=>{
  expect(defaultTpoDriveView(2)).toBe("REQUESTS");
  expect(defaultTpoDriveView(0)).toBe("LIVE");
  expect(defaultTpoDriveView(2,"ALL")).toBe("ALL");
  const service=source("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  const page=source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(service).toContain("needsReviewCount");
  expect(service).toContain("statusCounts");
  expect(page).toContain("data.statusCounts.drafts");
  expect(page).toContain("data.needsReviewCount");
  expect(page).toContain('aria-current={data.view===view?"page":undefined}');
 });
});
