import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {RECOVERY_ENTITY_TYPES,isRecoveryEntityType} from "@/modules/admin-ui/recovery-type-registry";

const read=(path:string)=>readFileSync(path,"utf8");

describe("chat-17 verification round 2: deleted tenant recovery",()=>{
 it("keeps all nine old LMS Deleted Items choices without pretending unsupported academic restores work",()=>{
  expect(RECOVERY_ENTITY_TYPES.map(type=>type.label)).toEqual([
   "Organization","College","Department","Program","Class",
   "Semester","Lecture Hall","Quiz","Notification",
  ]);
  expect(isRecoveryEntityType("college")).toBe(true);
  expect(RECOVERY_ENTITY_TYPES.find(type=>type.value==="college")?.implemented).toBe(true);
  expect(RECOVERY_ENTITY_TYPES.find(type=>type.value==="department")?.implemented).toBe(false);
 });
 it("fetches only archived colleges within the selected persisted college and organization scope",()=>{
  const service=read("src/modules/colleges/service.ts");
  const start=service.indexOf("export async function listArchivedColleges(");
  const end=service.indexOf("export async function resolveCollegeUsage(",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const implementation=service.slice(start,end);
  expect(implementation).toContain('isSuperAdmin(context)');
  expect(implementation).toContain('assertPersistedPlatformPermission(tx,context,"college.manage"');
  expect(implementation).toContain('eq(colleges.status,"ARCHIVED")');
  expect(implementation).toContain('eq(organizations.status,"ACTIVE")');
  expect(implementation).toContain('selectedCollegeId?eq(colleges.id,selectedCollegeId):undefined');
  expect(implementation).toContain('selectedOrganizationId?eq(colleges.organizationId,selectedOrganizationId):undefined');
  expect(implementation).toContain('.limit(200)');
 });
 it("renders a real, scoped restore action, not a dead option, with safe error messages",()=>{
  const page=read("src/app/(authenticated)/admin/organizations/page.tsx");
  expect(page).toContain('selectedRestoreType==="college"');
  expect(page).toContain("listArchivedColleges(context)");
  expect(page).toContain('<TenantRestoreAction kind="college"');
  expect(page).toContain("No archived colleges");
  const control=read("src/components/admin/tenant-restore-action.tsx");
  expect(control).toContain("FriendlyFetchError");
  expect(control).not.toContain("reason instanceof Error?reason.message");
  expect(control).toContain('method:"POST"');
  const deleteAction=read("src/components/academics/college-section-lifecycle-action.tsx");
  expect(deleteAction).toContain('academicSetupErrorMessage(code??reason,');
  expect(deleteAction).toContain("historical student, timetable and activity records");
 });
});
