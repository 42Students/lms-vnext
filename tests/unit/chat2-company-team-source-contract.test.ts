import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");

describe("Company Team tenant enforcement and source contract",()=>{
 it("TPO-companies-05 reads only college-related company messages behind persisted placement-team permissions",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('eq(placementCompanyRelationships.collegeId,college.id)');
  expect(service).toContain('eq(placementCompanyRelationships.companyId,companyId)');
  expect(service).toContain("eq(messages.collegeId,college.id)");
  expect(service).toContain("hasPlacementTeamMembership(context)");
  expect(service).toContain('placementTableExists("placement_tpo_company_team_messages")');
  expect(service).toContain('placementTableExists("placement_tpo_company_team_follows")');
 });
 it("TPO-companies-05 persists scoped messages, follows and assignee audits without inventing an old thread table",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  expect(service).toContain("tx.insert(messages).values");
  expect(service).toContain("tx.insert(activityEvents).values");
  expect(service).toContain("tx.insert(inAppNotifications).values");
  expect(service).toContain("if(!link)throw new TpoCompanyTeamError");
  expect(service).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
  expect(service).toContain("prioritizedCompanyTeamRecipients({");
  expect(service).toContain("actorMembershipId:membership.id");
  expect(service).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
 });
 it("TPO-inbox-team-16 TPO-companies-05 retain the current staged storage proposal and never simulate an installed table",()=>{
  const schema=src("src/db/schema/tpo-company-team.ts");
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  for(const name of ["placement_tpo_company_team_messages","placement_tpo_company_team_follows",
    "tpo_company_team_author_college_fk","tpo_company_team_follow_member_college_fk"]){
   expect(schema).toContain(name);
  }
  expect(schema).toContain("placementTpoCompanyTeamMessages");
  expect(schema).toContain("placementTpoCompanyTeamFollows");
  expect(service).toContain('placementTableExists("placement_tpo_company_team_messages")');
  expect(service).toContain('placementTableExists("placement_tpo_company_team_follows")');
  expect(src("src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx"))
   .toContain("require their registered database migration");
  expect(src("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx"))
   .toContain("Open in Team · Company discussion");
 });
 it("TPO-companies-05 treats a retried draft UUID as one transaction and never repeats notifications",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  const schema=src("src/db/schema/tpo-company-team.ts");
   const route=src("src/app/api/placements/tpo/companies/[companyId]/team/route.ts");
  expect(schema).toContain('uniqueIndex("tpo_company_team_message_send_dedupe_uq")');
   expect(route).toContain("idempotencyKey:parsed.data.idempotencyKey");
  expect(service).toContain("idempotencyKey:uuid.optional()");
  expect(service).toContain(".onConflictDoNothing().returning({id:messages.id})");
  expect(service).toContain("eq(messages.idempotencyKey,input.idempotencyKey)");
  expect(service).toContain("return {changed:false,id:original.id}");
 });
 it("TPO-inbox-team-16 retains archived company history while all writes still demand ACTIVE relationships",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  const page=src("src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx");
  expect(service).toContain("allowArchivedRead=false");
  expect(service).toContain("companyScope(context,companyId,true)");
  expect(service).toContain('canPost:company.relationshipStatus==="ACTIVE"');
  expect(page).toContain("result.canPost?");
  expect(page).toContain("This relationship is archived. Its discussion is read-only.");
 });
});
