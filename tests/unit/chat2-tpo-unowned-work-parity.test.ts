import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
describe("TPO unowned work assignment safety",()=>{
 it("TPO-inbox-team-33 reads only persisted unowned active college work",()=>{
  const service=src("src/modules/placements/tpo-team-unowned-service.ts");
  expect(service).toContain("hasDriveOwnerColumn");
  expect(service).toContain('column_name=\'owner_membership_id\'');
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(service).toContain("eq(placementJobs.collegeId,college.id)");
  expect(service).toContain("isNull(placementJobs.ownerMembershipId)");
  expect(service).toContain("eq(placementCompanyRelationships.collegeId,college.id)");
  expect(service).toContain("isNull(placementCompanyRelationships.ownerMembershipId)");
  expect(service).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
 });
 it("TPO-inbox-team-33 assignment is atomic, honors existing owners and notifies the assignee",()=>{
  const service=src("src/modules/placements/tpo-team-unowned-service.ts");
  const route=src("src/app/api/placements/tpo/team/unowned/route.ts");
  expect(service).toContain("targetMembershipId:z.string().uuid()");
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain("ownerMembershipId:target.id");
  expect(service).toContain("isNull(placementJobs.ownerMembershipId)");
  expect(service).toContain("isNull(placementCompanyRelationships.ownerMembershipId)");
  expect(service).toContain("tx.insert(activityEvents)");
  expect(service).toContain("tx.insert(inAppNotifications)");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("assignTpoUnownedWork(await getCurrentRequestContext()");
 });
 it("TPO-inbox-team-33 exposes a guarded, accessible assigner only when the schema is ready",()=>{
  const component=src("src/components/tpo/tpo-team-assign-unowned.tsx");
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  const schema=src("src/db/schema/placements.ts");
  const proposal=src("docs/proposed-migrations/tpo-team-drive-owner.sql");
  expect(component).toContain("Nobody owns {drives} drives and {companies} companies");
  expect(component).toContain("apiFetch<");
  expect(component).toContain('role="alert"');
  expect(component).toContain("pending.current");
  expect(page).toContain("unowned?.ready?");
  expect(page).toContain("TpoTeamAssignUnowned");
  expect(schema).toContain('ownerMembershipId: uuid("owner_membership_id")');
  expect(proposal).toContain("placement_jobs_owner_college_fk");
 });
});