import {describe,expect,it} from "vitest";
import {canUndoTpoAnnouncementSend} from "@/modules/announcements/tpo-notice-undo-model";
describe("T-S2-07 30-second undo send",()=>{
 const created=new Date("2026-10-16T03:00:00Z");
 it("is allowed before the boundary only",()=>{
  expect(canUndoTpoAnnouncementSend(created,new Date(created.getTime()+29_999))).toBe(true);
  expect(canUndoTpoAnnouncementSend(created,new Date(created.getTime()+30_000))).toBe(false);
  expect(canUndoTpoAnnouncementSend(created,new Date(created.getTime()-1))).toBe(false);
 });
});
