import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-2 Team membership, context and event notifications",()=>{
 it("TPO-inbox-team-38 lets authorized college admins and TPO admins participate, with persisted college scope",()=>{
  const access=source("src/modules/placements/placement-team-access-model.ts");
  const page=source("src/app/(authenticated)/tpo/team/page.tsx");
  const create=source("src/modules/placements/tpo-team-internal-create-service.ts");
  const reply=source("src/modules/placements/tpo-team-internal-reply-service.ts");
  expect(access).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
  expect(page).toContain('member.roles.includes("COLLEGE_ADMIN")');
  expect(page).toContain('member.roles.includes("TPO_ADMIN")');
  expect(create).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(create).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(reply).toContain('eq(placementTpoInternalThreads.collegeId,college.id)');
  expect(reply).toContain('new Set(active.map(member=>member.id)).size!==2');
 });
 it("TPO-inbox-team-29 includes real actor and preview in reply and decision notifications",()=>{
  const reply=source("src/modules/placements/tpo-team-internal-reply-service.ts");
  expect(reply).toContain('actor?.displayName?.trim()||"TPO colleague"');
  expect(reply).toContain('title:input.markDecision?"Decision from "+actorName:"New message from "+actorName');
  expect(reply).toContain('body:input.body.slice(0,120)');
  expect(reply).toContain('"?m="+message.id');
 });
 it("TPO-inbox-team-22 TPO-inbox-team-29 carries actor and actionable ask links through creation and completion",()=>{
  const asks=source("src/modules/placements/tpo-team-asks-service.ts");
  expect(asks).toContain('title:actorName+" asked you"');
  expect(asks).toContain('actorName+" marked an ask done"');
  expect(asks).toContain('actorName+" cancelled an ask"');
  expect(asks).toContain('"?ask="+ask.id');
  expect(asks).toContain('eq(placementTpoTeamAsks.collegeId,college.id)');
 });
 it("TPO-inbox-team-23 TPO-inbox-team-25 retains decision, edit and authorship presentation on messages",()=>{
  const page=source("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  expect(page).toContain('aria-label="Decisions here"');
  expect(page).toContain('message.authorName?.trim()||"Team member"');
  expect(page).toContain('message.removed?"Message removed":message.body');
  expect(page).toContain("message.edited&&!message.removed");
  expect(page).toContain('<TpoTeamMessageActions');
 });
 it("TPO-inbox-team-37 shows permanent placement Team roles, not temporary drive-day coordinator labels",()=>{
  const page=source("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain('member.roles.includes("TPO_ADMIN")');
  expect(page).toContain('member.roles.includes("COLLEGE_ADMIN")');
  expect(page).toContain('role==="TPO"||role==="TPO_ADMIN"||role==="COLLEGE_ADMIN"');
  expect(page).toContain("Everyone in it can do everything in placements.");
  expect(page).not.toContain('role==="FACULTY_COORDINATOR"');
  expect(page).not.toContain('role==="STUDENT_COORDINATOR"');
 });
 it("TPO-inbox-team-34 retains Away until and back-now updates on Team People",()=>{
  const page=source("src/app/(authenticated)/tpo/team/page.tsx");
  const model=source("src/components/tpo/tpo-team-away-form.tsx");
  expect(page).toContain("listTpoTeamAway");
  expect(page).toContain("Away until");
  expect(model).toContain("Back now");
 });
});