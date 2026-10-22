import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {collegePromotionExecuteSchema} from "@/modules/academics/college-batch-promotion-model";

describe("SA-academics-people-24 scoped Super Admin promotion execution",()=>{
 it("mounts the same explicit confirmation as College Admin only after readiness",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/batch-promotion/page.tsx","utf8");
  expect(page).toContain("<CollegePromotionConfirmation");
  expect(page).toContain("preview.simulatedReadiness");
  expect(page).toContain('preview.plan.action === "PROMOTE"');
  expect(page).toContain("preview.batch.version");
  expect(page).toContain("input.data.yearStart !== undefined ? {yearStart:input.data.yearStart} : {}");
 });
 it("checks selected persisted tenant with existing versioned transaction and audit",()=>{
  const service=readFileSync("src/modules/academics/college-batch-promotion-execute.ts","utf8");
  expect(service).toContain('resolveActingCollege(context, "academics.manage")');
  expect(service).toContain('eq(departments.collegeId, member.collegeId)');
  expect(service).toContain("previewCollegeBatchPromotionInTransaction");
  expect(service).toContain("promotionPreviewMatches");
  expect(service).toContain("recordActivityEventInTransaction");
  expect(collegePromotionExecuteSchema.safeParse({}).success).toBe(false);
 });
});
