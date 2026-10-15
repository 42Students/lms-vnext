import {describe,it,expect} from "vitest";
import {requireCurrentAnnouncementVersion} from "@/modules/announcements/announcement-version-guard";
describe("DB10 announcement soft-delete CAS",()=>{
 it("allows the current version even for a no-op",()=>expect(()=>requireCurrentAnnouncementVersion(4,4)).not.toThrow());
 it("rejects stale delete retries",()=>expect(()=>requireCurrentAnnouncementVersion(5,4)).toThrow("STALE_VERSION"));
 it("rejects malformed version",()=>{
  expect(()=>requireCurrentAnnouncementVersion(0,-1)).toThrow("STALE_VERSION");
  expect(()=>requireCurrentAnnouncementVersion(0,NaN)).toThrow("STALE_VERSION");
 });
});
