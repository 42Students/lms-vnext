import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoTeamAskCreateSchema,tpoTeamAskActionSchema,tpoTeamAskCanTransition,tpoTeamAskState}
 from "@/modules/placements/tpo-team-asks-model";
const src=(p:string)=>readFileSync(p,"utf8");
const threadId="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const asker="33333333-3333-4333-8333-333333333333";
const key="44444444-4444-4444-8444-444444444444";
describe("Team asks permission and lifecycle",()=>{
 it("TPO-inbox-team-22 validates an idempotent named ask with optional timestamp",()=>{
  const base={threadId,assigneeMembershipId:other,requestKey:key,title:"Send result sheet"};
  expect(tpoTeamAskCreateSchema.safeParse({...base,dueAt:null}).success).toBe(true);
  expect(tpoTeamAskCreateSchema.safeParse({...base,dueAt:"2099-12-01T17:30:00+05:30"}).success).toBe(true);
  expect(tpoTeamAskCreateSchema.safeParse({...base,dueAt:"tomorrow"}).success).toBe(false);
  expect(tpoTeamAskCreateSchema.safeParse({...base,title:"x".repeat(201),dueAt:null}).success).toBe(false);
  expect(tpoTeamAskCreateSchema.safeParse({...base,requestKey:"",dueAt:null}).success).toBe(false);
 });
 it("TPO-inbox-team-22 accepts only the assignee marking done and the asker cancelling",()=>{
  expect(tpoTeamAskCanTransition("DONE",other,asker,other)).toBe(true);
  expect(tpoTeamAskCanTransition("DONE",asker,asker,other)).toBe(false);
  expect(tpoTeamAskCanTransition("CANCEL",asker,asker,other)).toBe(true);
  expect(tpoTeamAskCanTransition("CANCEL",other,asker,other)).toBe(false);
  expect(tpoTeamAskActionSchema.safeParse({threadId,askId:key,action:"DONE",expectedStatus:"OPEN",note:"Done"}).success).toBe(true);
  expect(tpoTeamAskActionSchema.safeParse({threadId,askId:key,action:"CANCEL",expectedStatus:"DONE"}).success).toBe(false);
 });
 it("TPO-inbox-team-22 distinguishes overdue from completed and cancelled states",()=>{
  const now=new Date("2099-01-15T12:00:00.000Z");
  expect(tpoTeamAskState("OPEN",new Date("2099-01-14T00:00:00.000Z"),now)).toBe("OVERDUE");
  expect(tpoTeamAskState("OPEN",new Date("2099-01-16T00:00:00.000Z"),now)).toBe("OPEN");
  expect(tpoTeamAskState("DONE",new Date("2099-01-14T00:00:00.000Z"),now)).toBe("DONE");
  expect(tpoTeamAskState("CANCELLED",new Date("2099-01-14T00:00:00.000Z"),now)).toBe("CANCELLED");
 });
 it("TPO-inbox-team-22 enforces request scopes, row lock and audit on every state-changing route",()=>{
  const service=src("src/modules/placements/tpo-team-asks-service.ts");
  const create=src("src/app/api/placements/tpo/team/threads/[threadId]/asks/route.ts");
  const change=src("src/app/api/placements/tpo/team/threads/[threadId]/asks/[askId]/route.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('eq(placementTpoTeamAsks.collegeId,college.id)');
  expect(service).toContain('eq(placementTpoTeamAsks.status,"OPEN")');
  expect(service).toContain('for("update")');
  expect(service).toContain("tpoTeamAskCanTransition");
  for(const route of [create,change])expect(route).toContain("isSameOriginRequest(request)");
 });
 it("TPO-inbox-team-29 notifies each actual assignment lifecycle event through scoped in-app notifications",()=>{
  const service=src("src/modules/placements/tpo-team-asks-service.ts");
  expect(service).toContain("inAppNotifications");
  expect(service).toContain("placements.tpo_team.ask_created");
  expect(service).toContain("placements.tpo_team.ask_done");
  expect(service).toContain("placements.tpo_team.ask_cancelled");
  expect(service).toContain('"?ask="+ask.id');
  expect(service).toContain('userId:assignee.userId');
 });
 it("TPO-inbox-team-30 opens a valid ask deeplink in its authorized conversation",()=>{
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const panel=src("src/components/tpo/tpo-team-ask-panel.tsx");
  expect(page).toContain("highlightAskId={highlightAskId}");
  expect(panel).toContain('document.getElementById("team-ask-"+highlightAskId)');
  expect(panel).toContain("Could not send the ask. Your draft is still here.");
  expect(panel).toContain("timeoutMs:12000");
  expect(panel).not.toContain("window.confirm(");
 });
 it("TPO-inbox-team-22 records proposed scoped table/foreign keys, not an unnumbered production migration",()=>{
  const proposal=src("docs/proposed-migrations/tpo-team-asks.sql");
  const schema=src("src/db/schema/tpo-internal.ts");
  expect(proposal).toContain("tpo_team_asks_assignee_college_fk");
  expect(proposal).toContain("tpo_team_asks_dedupe_uq");
  expect(schema).toContain("placementTpoTeamAsks=pgTable");
 });
});
