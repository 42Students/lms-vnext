import {describe,it,expect} from "vitest";
import {parseSuperAdminAnnouncementParams} from "@/modules/announcements/super-admin-list-query";
import {announcementAdminListSchema} from "@/modules/announcements/validation";
import {parseAnnouncementAdminApiQuery} from "@/modules/announcements/admin-api-query";
describe("DB10 scoped announcement history search",()=>{
 it("normalizes empty form search into no search",()=>expect(parseSuperAdminAnnouncementParams({q:""})).toMatchObject({}));
 it("trims text and limits search length",()=>{
  expect(parseSuperAdminAnnouncementParams({q:"  release "})?.q).toBe("release");
  expect(parseSuperAdminAnnouncementParams({q:"x".repeat(121)})).toBeNull();
  expect(announcementAdminListSchema.safeParse({q:"x".repeat(121)}).success).toBe(false);
 });
 it("treats percent and underscore as literal search terms",()=>{
  expect(announcementAdminListSchema.parse({q:"100%_"}).q).toBe("100%_");
  expect(parseAnnouncementAdminApiQuery(new URLSearchParams("q=100%25_"))?.q).toBe("100%_");
 });
 it("rejects duplicate search keys",()=>expect(parseAnnouncementAdminApiQuery(new URLSearchParams("q=hello&q=world"))).toBeNull());
});
