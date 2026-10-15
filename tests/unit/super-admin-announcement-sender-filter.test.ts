import {describe,it,expect} from "vitest";
import {parseSuperAdminAnnouncementParams as parse} from "@/modules/announcements/super-admin-list-query";
import {ANNOUNCEMENT_SENDER_TYPES,announcementAdminListSchema} from "@/modules/announcements/validation";
import {parseAnnouncementAdminApiQuery as api} from "@/modules/announcements/admin-api-query";
describe("DB10 announcement sender role filter",()=>{
 it.each(ANNOUNCEMENT_SENDER_TYPES)("accepts %s",senderType=>{
  expect(parse({senderType})?.senderType).toBe(senderType);
  expect(announcementAdminListSchema.parse({senderType}).senderType).toBe(senderType);
  expect(api(new URLSearchParams("senderType="+senderType))?.senderType).toBe(senderType);
 });
 it("accepts unfiltered Any",()=>expect(parse({senderType:""})?.senderType).toBeUndefined());
 it("denies arbitrary role",()=>expect(parse({senderType:"ADMIN"})).toBeNull());
});
