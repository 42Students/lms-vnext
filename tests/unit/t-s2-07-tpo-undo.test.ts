import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {canUndoTpoAnnouncementSend} from "@/modules/announcements/tpo-notice-undo-model";
describe("T-S2-07 30-second undo send",()=>{
 const created=new Date("2026-10-16T03:00:00Z");
 it("is allowed before the boundary only",()=>{
  expect(canUndoTpoAnnouncementSend(created,new Date(created.getTime()+29_999))).toBe(true);
  expect(canUndoTpoAnnouncementSend(created,new Date(created.getTime()+30_000))).toBe(false);
  expect(canUndoTpoAnnouncementSend(created,new Date(created.getTime()-1))).toBe(false);
 });
 it("starts only from persisted dispatch for scheduled notices, in both UI and write guard",()=>{
  const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
  const page=read("src/app/(authenticated)/tpo/announcements/page.tsx");
  const lifecycle=read("src/modules/announcements/tpo-placement-notice-lifecycle.ts");
  expect(page).toContain("return row.sentAt;");
  expect(page).toContain("sentAt!==null&&canUndoTpoAnnouncementSend(sentAt,now)");
  expect(lifecycle).toContain("sentAt:announcementBroadcastGroups.sentAt");
  expect(lifecycle).toContain("if(!sentAt)throw new Error(\"ANNOUNCEMENT_NOT_SENT\")");
  expect(lifecycle).toContain("canUndoTpoAnnouncementSend(sentAt,now)");
  expect(lifecycle).not.toContain("current.scheduledAt??current.createdAt");
 });
});
