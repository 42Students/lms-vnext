import {describe,it,expect} from "vitest";
import {tpoJobTypeNameSchema} from "@/modules/placements/tpo-configuration-model";
import {readFileSync} from "node:fs";import {join} from "node:path";
const s=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 TPO job-type and drive-approval verification",()=>{
 it("TPO-settings-audit-20 keeps built-in placement outcomes fixed, with a guarded visibility switch",()=>{
  const source=s("src/components/tpo/tpo-builtin-job-types-editor.tsx");
  expect(source).toContain("Their names and counts-as-placed answers are fixed");
  expect(source).toContain("existing drives keep their type.");
  expect(source).toContain("activeCount<=1");
 });
 it("TPO-settings-audit-21 requires an explicit placed decision for each new custom job type",()=>{
  const source=s("src/components/tpo/tpo-unified-job-types-editor.tsx");
  expect(source).toContain("newPlaced === null");
  expect(source).toContain("setNewPlaced(true)");
  expect(source).toContain("setNewPlaced(false)");
 });
 it("TPO-settings-audit-22 preserves in-use job-type history by deactivating instead of deleting a referenced category",()=>{
  const source=s("src/modules/placements/tpo-job-type-write-service.ts");
  expect(source).toContain("TPO_JOB_TYPE_LAST_ACTIVE");
  expect(source).toContain("TPO_JOB_TYPE_BUILTIN");
  expect(source).toContain("renameSchema");
  expect(source).toContain('if(usageCount>0)throw new TpoConfigError("TPO_JOB_TYPE_IN_USE"');
  expect(source).toContain("const usageCount=usage?.n??0");
  const remove=source.slice(source.indexOf("export async function removeTpoJobType("),source.indexOf("const bulkJobTypeSchema="));
  expect(remove).toContain('if(usageCount>0)throw new TpoConfigError("TPO_JOB_TYPE_IN_USE"');
  expect(remove.indexOf('if(usageCount>0)')).toBeLessThan(remove.indexOf("tx.delete(placementTpoJobTypes)"));
  const bulk=source.slice(source.indexOf("export async function saveTpoJobTypes("));
  expect(bulk).toContain('if(oldDrives>0)throw new TpoConfigError("TPO_JOB_TYPE_IN_USE"');
  expect(bulk.indexOf("if(oldDrives>0)")).toBeLessThan(bulk.indexOf("tx.delete(placementTpoJobTypes)"));
 });
 it("TPO-settings-audit-24 validates college custom job-type names before persistence",()=>{
  expect(tpoJobTypeNameSchema.safeParse("Graduate Trainee").success).toBe(true);
  expect(tpoJobTypeNameSchema.safeParse("x").success).toBe(false);
  expect(tpoJobTypeNameSchema.safeParse("<script>").success).toBe(false);
  expect(tpoJobTypeNameSchema.safeParse("!".repeat(41)).success).toBe(false);
 });
 it("TPO-settings-audit-50 retains manual review by default and limits verified policy auto-approval to drafts",()=>{
  const service=s("src/modules/placements/recruiter-drive-request-service.ts");
  expect(service).toContain('status:"REQUEST"');
  expect(service).toContain("settings?.approvalRequired??true");
  expect(service).toContain("if(policy.autoApprove)");
  expect(service).toContain('status:"DRAFT",approvedJobId');
  expect(service).toContain("Never drop a valid request or publish on an unreviewed assumption.");
  expect(service).toContain("informPlacementCell");
 });
});
