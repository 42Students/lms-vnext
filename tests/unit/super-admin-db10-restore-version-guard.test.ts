import {describe,it,expect} from "vitest";
import {requireCurrentAnnouncementVersion} from "@/modules/announcements/announcement-version-guard";
describe("DB10 announcement restore CAS",()=>{
 it("honors exact version",()=>expect(()=>requireCurrentAnnouncementVersion(8,8)).not.toThrow());
 it("rejects an obsolete restore even when restored already",()=>expect(()=>requireCurrentAnnouncementVersion(9,8)).toThrow("STALE_VERSION"));
 it("rejects future expected version",()=>expect(()=>requireCurrentAnnouncementVersion(7,8)).toThrow("STALE_VERSION"));
});
