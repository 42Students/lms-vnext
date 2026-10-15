import {describe,it,expect} from "vitest";
import {announcementVisibilityAt as state} from "@/modules/announcements/visibility-model";
import {parseSuperAdminAnnouncementParams as parse} from "@/modules/announcements/super-admin-list-query";
import {announcementAdminListSchema} from "@/modules/announcements/validation";
const now=Date.parse("2026-11-01T12:00:00Z");
const base={deletedAt:null,scheduledAt:null,expiresAt:null};
describe("DB10 notice visibility",()=>{
 it("classifies unscheduled active as live",()=>expect(state(base,now)).toBe("LIVE"));
 it("keeps schedule boundary inclusive",()=>expect(state({...base,scheduledAt:new Date(now)},now)).toBe("LIVE"));
 it("identifies future scheduled",()=>expect(state({...base,scheduledAt:new Date(now+1000)},now)).toBe("SCHEDULED"));
 it("expires exactly on end boundary",()=>expect(state({...base,expiresAt:new Date(now)},now)).toBe("EXPIRED"));
 it("never exposes deleted as live",()=>expect(state({...base,deletedAt:new Date(now-1000)},now)).toBe("DELETED"));
 it("validates known states and denies unknown",()=>{
  expect(parse({visibility:"DELETED"})?.visibility).toBe("DELETED");
  expect(parse({visibility:"VISIBLE"})).toBeNull();
  expect(announcementAdminListSchema.safeParse({visibility:"VISIBLE"}).success).toBe(false);
 });
});
