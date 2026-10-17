import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Tenant settings scope and safety",()=>{
 it("SA-tenants-modules-33 edits global and scoped college settings with a styled high-impact confirmation",()=>{
  const page=src("src/app/(authenticated)/admin/settings/page.tsx");
  const editor=src("src/components/admin/tenant-settings-editor.tsx");
  expect(page).toContain('listAdminTenantSettings(context,"COLLEGE",context.adminScope.collegeId)');
  expect(page).toContain('listAdminTenantSettings(context,"GLOBAL")');
  expect(page).toContain('key={editorScope+":"+(context.adminScope?.collegeId??"GLOBAL")}');
  expect(editor).toContain("const [impactConfirm,setImpactConfirm]=useState(false)");
  expect(editor).toContain("<ConfirmDialog open={impactConfirm}");
  expect(editor).toContain("onConfirm={()=>{void save(true);}}");
  expect(editor).toContain("confirmedHighImpact:impact");
  expect(editor).toContain("expectedVersion:existing.get(spec.key)?.version??0");
  expect(editor).not.toContain("window.confirm");
 });
 it("SA-tenants-modules-36 37 39 exposes typed stored SMS, course-progress and operation-limit keys without claiming live deployment",()=>{
  const specs=src("src/modules/platform-settings/legacy-setting-specs.ts");
  const editor=src("src/components/admin/tenant-settings-editor.tsx");
  for(const key of ["sms.senderId","sms.attendanceAbsenceTemplate","sms.attendanceCorrectionTemplate",
   "sms.traiJobUpdateTemplate","course.watchedThresholdPercent","course.minInProgressPercent",
   "ui.chatPollIntervalMs","ui.progressSaveIntervalMs","ops.bulkStatusMax",
   "ops.progressBulkIdsMax","ops.identityMaxJsonSize","ops.announcementMaxPageSize"]){
    expect(specs).toContain('"'+key+'"');
  }
  expect(editor).toContain("Platform security overrides require a separate rollout before taking effect.");
 });
});
