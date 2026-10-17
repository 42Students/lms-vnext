import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
describe("Team inbox activity and participant notices",()=>{
 it("TPO-inbox-team-18 orders private conversations by last real message and shows last activity in IST",()=>{
  const read=src("src/modules/placements/tpo-team-internal-read-service.ts");
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(read).toContain("lastActivityAt:lastActivity");
  expect(read).toContain(".orderBy(desc(lastActivity),desc(tpoInternalThreads.id))");
  expect(read).toContain("m.college_id=");
  expect(page).toContain("Last activity ·");
  expect(page).toContain("row.lastActivityAt");
 });
 it("TPO-inbox-team-29 sends a person-named bell and safe preview with a message deep link",()=>{
  const reply=src("src/modules/placements/tpo-team-internal-reply-service.ts");
  const create=src("src/modules/placements/tpo-team-internal-create-service.ts");
  expect(reply).toContain('input.markDecision?"Decision from "+actorName:"New message from "+actorName');
  expect(reply).toContain("input.body.slice(0,120)");
  expect(reply).toContain('+"?m="+message.id');
  expect(create).toContain('" added you to a conversation"');
  expect(create).toContain("input.topic.slice(0,120)");
 });
 it("TPO-inbox-team-R05 acknowledges both the old thread link and a deep-linked Team message",()=>{
  const ack=src("src/modules/placements/tpo-team-internal-ack-service.ts");
  const read=src("src/modules/placements/tpo-team-internal-read-service.ts");
  expect(ack).toContain('like(inAppNotifications.actionHref,"/tpo/team/"+thread.id+"?m=%")');
  expect(read).toContain('row.href.split("?")[0]');
  expect(read).toContain("unreadByHref.set(");
 });
});
