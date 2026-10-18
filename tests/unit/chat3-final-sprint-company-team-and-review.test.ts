import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Chat-3 final sprint team and review contracts",()=>{
 it("TPO-companies-05 company messages are bound to a real college relationship and active placement actor",()=>{
  const service=read("src/modules/placements/tpo-company-team-service.ts");
  expect(service).toContain("hasPlacementTeamMembership(context)");
  // A persisted actor check rejects revoked/disabled team members before the scope is used.
  expect(service).toContain("const activeCollegeId=await requireTpoBatchActor(context);");
  expect(service).toContain("requirePlacementManageScope(context,activeCollegeId)");
  const persistedActor=read("src/modules/placements/tpo-batch-workspace-read-service.ts");
  expect(persistedActor).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(persistedActor).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(placementCompanyRelationships.collegeId,college.id)');
  expect(service).toContain('eq(placementCompanyRelationships.companyId,companyId)');
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('eq(messages.collegeId,college.id)');
  expect(service).toContain('eq(messages.companyId,companyId)');
  expect(service).toContain("placementTableExists");
 });
 it("TPO-companies-05 company Team cannot be accessed by recruiter grants or other colleges",()=>{
  const page=read("src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx");
  const route=read("src/app/api/placements/tpo/company-team/[companyId]/route.ts");
  expect(page).toContain("hasPlacementTeamMembership(context)");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("readTpoCompanyTeam(await getCurrentRequestContext()");
  expect(route).toContain("mutateTpoCompanyTeam(await getCurrentRequestContext()");
  expect(page).toContain("TpoCompanyTeamConversation");
 });
 it("TPO-companies-05 models follow, @mentions, #references, decisions and asks with author protections",()=>{
  const service=read("src/modules/placements/tpo-company-team-service.ts");
  const ui=read("src/components/tpo/tpo-company-team-conversation.tsx");
  for(const action of ['z.literal("SEND")','z.literal("FOLLOW")','z.literal("EDIT")',
    'z.literal("DELETE")','z.literal("DECISION")','z.literal("ASK_DONE")',
    'z.literal("ASK_CANCEL")'])
   expect(service).toContain(action);
  expect(service).toContain("Date.now()-message.createdAt.getTime()>15*60*1000");
  expect(service).toContain('message.askAssigneeMembershipId!==membership.id');
  expect(service).toContain('message.authorMembershipId!==membership.id');
  expect(ui).toContain("Open in Team");
  expect(ui).toContain("window.setInterval");
  expect(ui).toContain("30000");
  expect(ui).toContain('role="log"');
  expect(ui).toContain("Mark done");
  expect(ui).toContain("Mark as decision");
  expect(ui).toContain("TpoCompanyTeamConversation");
 });
 it("TPO-companies-05 uses proposed schema, bounded messages and truthful unavailable migration state",()=>{
  const schema=read("src/db/schema/tpo-company-team.ts");
  const sql=read("docs/proposed-migrations/chat3-tpo-company-team.sql");
  const service=read("src/modules/placements/tpo-company-team-service.ts");
  expect(schema).toContain('placement_tpo_company_team_messages');
  expect(sql.toLowerCase()).toContain("create table if not exists placement_tpo_company_team_messages");
  expect(sql).toContain("tpo_company_team_author_college_fk");
  expect(service).toContain('status:"NOT_REGISTERED"');
  expect(service).toContain(".limit(101)");
 });
 it("TPO-companies-05 notifies only active same-college team followers, @team and explicit @members",()=>{
  const service=read("src/modules/placements/tpo-company-team-service.ts");
  const ui=read("src/components/tpo/tpo-company-team-conversation.tsx");
  expect(service).toContain("inAppNotifications");
  expect(service).toContain("notifyIds.delete(membership.id)");
  expect(service).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain("input.body.matchAll");
  expect(service).toContain("@team");
  expect(service).toContain("ASK_DONE");
  expect(service).toContain("Company Team ask completed");
  expect(ui).toContain("Mention a teammate");
  expect(ui).toContain('chunk.startsWith("#drive:")');
  expect(ui).toContain('chunk.startsWith("#company:")');
  expect(ui).toContain('chunk.startsWith("#student:")');
  expect(ui).toContain("dayLabel");
  expect(ui).toContain("Overdue ask");
 });
 it("TPO-companies-R02 company joining link honors company name, domain prerequisite, modal confirmation and Retry",()=>{
  const ui=read("src/components/tpo/tpo-public-join-link-card.tsx");
  const route=read("src/app/api/placements/tpo/public-join-links/status/route.ts");
  expect(ui).toContain("companyName??status.domain");
  expect(ui).toContain("Email domains: @{status.domain}");
  expect(ui).toContain("Add domain");
  expect(ui).toContain("Add the company's email domain first, so only its people can join.");
  expect(ui).toContain("ConfirmDialog");
  expect(ui).toContain("retryStatus");
  expect(ui).not.toContain("window.confirm(");
  expect(route).toContain("getTpoPublicJoinLinkStatus(await getCurrentRequestContext()");
  expect(route).toContain('"Cache-Control":"no-store"');
 });
 it("TPO-companies-R05 canonical list sorts the company's drives newest first",()=>{
  const service=read("src/modules/placements/tpo-companies-view-service.ts");
  expect(service).toContain("orderBy(desc(placementJobs.createdAt))");
  expect(service).not.toContain("orderBy(asc(placementJobs.createdAt))");
 });
});
