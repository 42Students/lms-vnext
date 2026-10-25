import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {bulkDrivePreflightSchema} from "@/modules/placements/bulk-drive-model";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const uuid="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
describe("TPO Add-to-Drive bulk scope preview",()=>{
 it("TPO-students-14 caps selection at 200, rejects duplicates, and requires an actual drive role",()=>{
  expect(bulkDrivePreflightSchema.safeParse({roleOptionId:uuid,membershipIds:[uuid]}).success).toBe(true);
  expect(bulkDrivePreflightSchema.safeParse({roleOptionId:uuid,membershipIds:[uuid,uuid]}).success).toBe(false);
  expect(bulkDrivePreflightSchema.safeParse({roleOptionId:uuid,membershipIds:Array.from({length:201},(_,n)=>"invalid-"+n)}).success).toBe(false);
 });
 it("TPO-students-14 preflights active applications with college-scoped drive/role without mutations",()=>{
  const route=src("src/app/api/placements/jobs/[jobId]/bulk-add/preflight/route.ts");
  const service=src("src/modules/placements/bulk-drive-service.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(service).toContain("export async function previewBulkDriveAdd(");
  expect(service).toContain("loadManagedDrive(context,placementJobIdSchema.parse(rawJobId))");
  expect(service).toContain("alreadyAppliedCount:new Set(rows.map(row=>row.membershipId)).size");
 });
 it("TPO-students-14 reuses authorized whole-filter rows and retains unsuccessful selections",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  const ui=src("src/components/tpo/tpo-students-bulk-add.tsx");
  expect(page).toContain("roster.total<=5000 && data.exportRows ? {allLearners:data.exportRows.map(student=>");
  expect(ui).toContain("Search open drives");
  expect(ui).toContain("200 learners from this filtered roster");
  expect(ui).toContain('alreadyAppliedCount+" of them already applied."');
  expect(ui).toContain('result.status==="added"||result.status==="already-added"');
  expect(ui).toContain("formatTpoStudentsBulkOutcome(result)");
  expect(ui).toContain("reviewedSelection!==selectionFingerprint");
  expect(ui).toContain("selectionFingerprint=JSON.stringify({jobId:driveId,roleOptionId");
  expect(ui).toContain("Review existing applications again before confirming.");
 });
});
