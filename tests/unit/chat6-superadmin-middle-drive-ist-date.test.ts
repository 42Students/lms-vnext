import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {adminDriveIstDate} from "@/modules/placements/admin-drive-directory-model";

describe("Super Admin placement drive directory date safety",()=>{
 it("SA-admin-middle-drives-IST-01 rolls UTC evening deadlines and posted dates into the correct IST calendar day",()=>{
  const instant=new Date("2026-10-18T20:00:00.000Z");
  expect(adminDriveIstDate(instant)).toBe("19 Oct 2026");
  expect(adminDriveIstDate(new Date("2026-10-18T01:00:00.000Z"))).toBe("18 Oct 2026");
  expect(adminDriveIstDate(null)).toBe("—");
  expect(adminDriveIstDate(new Date(Number.NaN))).toBe("—");
 });
 it("SA-admin-middle-drives-IST-01 never renders a UTC ISO date fragment for either timestamp",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/placements/drives/page.tsx","utf8");
  expect(page).toContain("adminDriveIstDate(row.job.applicationDeadline)");
  expect(page).toContain("adminDriveIstDate(row.job.publishedAt)");
  expect(page).not.toContain("row.job.applicationDeadline.toISOString().slice(0,10)");
  expect(page).not.toContain("row.job.publishedAt?.toISOString().slice(0,10)");
 });
});
