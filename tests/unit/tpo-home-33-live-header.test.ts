import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoHeaderSnapshotSchema} from "@/modules/activity/tpo-header-snapshot-model";

describe("TPO-home-33 and TPO-inbox-team-62 live topbar counts",()=>{
 const valid={messages:2,unread:3,items:[{id:"11111111-1111-4111-8111-111111111111",
  title:"A recruiter replied",body:null,actionHref:"/tpo/messages",readAt:null,createdAt:"2026-10-16T05:30:00.000Z"}]};
 it("TPO-home-33 accepts only non-negative integer counts and a bounded bell snapshot",()=>{
  expect(tpoHeaderSnapshotSchema.safeParse(valid).success).toBe(true);
  expect(tpoHeaderSnapshotSchema.safeParse({...valid,messages:-1}).success).toBe(false);
  expect(tpoHeaderSnapshotSchema.safeParse({...valid,unread:1.5}).success).toBe(false);
  expect(tpoHeaderSnapshotSchema.safeParse({...valid,items:Array(21).fill(valid.items[0])}).success).toBe(false);
 });
 it("TPO-inbox-team-62 polls every 30 seconds while visible and on visibilitychange",()=>{
  const ui=readFileSync("src/components/tpo/tpo-header-indicators.tsx","utf8");
  expect(ui).toContain('window.setInterval(');
  expect(ui).toContain('},30000)');
  expect(ui).toContain('document.addEventListener("visibilitychange",onVisibility)');
  expect(ui).toContain('"/api/tpo/header-snapshot"');
  expect(ui).toContain('href="/tpo/messages"');
  const route=readFileSync("src/app/api/tpo/header-snapshot/route.ts","utf8");
  expect(route).toContain("getTpoPersonalInbox(context");
  expect(route).toContain("countTpoUnreadRecruiterMessages(context)");
  expect(route).toContain('"Cache-Control":"private, no-store"');
 });
 it("TPO-home-33 keeps bell local read state consistent with refreshed server revisions",()=>{
  const source=readFileSync("src/components/tpo/tpo-bell-panel.tsx","utf8");
  expect(source).toContain("allReadRevision===revision");
  expect(source).toContain("displayedItems.some(item=>item.id===id&&!item.readAt)");
  expect(source).toContain("setAllReadRevision(null)");
  expect(source).toContain("setLatest({items:parsed.data.items,unread:parsed.data.unread})");
 });
});
