import {describe,it,expect} from "vitest";
import {parseSuperAdminAnnouncementParams as parse} from "@/modules/announcements/super-admin-list-query";
import {announcementAdminListSchema} from "@/modules/announcements/validation";
import {parseAnnouncementAdminApiQuery} from "@/modules/announcements/admin-api-query";
describe("DB10 persisted receiver type filter",()=>{
 it.each(["COLLEGE","PROGRAM","DEPARTMENT","CLASS","LEARNER","FACULTY"])("accepts %s",type=>{
  expect(parse({receiverType:type})?.receiverType).toBe(type);
  expect(announcementAdminListSchema.safeParse({receiverType:type}).success).toBe(true);
 });
 it("normalizes form Any into no filter",()=>expect(parse({receiverType:""})?.receiverType).toBeUndefined());
 it("denies unsafe or unknown audience",()=>{
  expect(parse({receiverType:"SYSTEM"})).toBeNull();
  expect(parse({receiverType:["COLLEGE","LEARNER"]})).toBeNull();
  expect(parseAnnouncementAdminApiQuery(new URLSearchParams("receiverType=INVALID"))).toBeNull();
 });
});
