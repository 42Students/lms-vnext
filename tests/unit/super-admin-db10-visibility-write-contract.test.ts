import {describe,it,expect} from "vitest";
import {announcementAdminListSchema,announcementUpdateSchema} from "@/modules/announcements/validation";
import {parseAnnouncementAdminApiQuery} from "@/modules/announcements/admin-api-query";
describe("DB10 notice visibility is list-only",()=>{
 it("accepts safe visibility states in admin read schema",()=>{
  for(const visibility of ["LIVE","SCHEDULED","EXPIRED","DELETED"]){
   expect(announcementAdminListSchema.parse({visibility}).visibility).toBe(visibility);
   expect(parseAnnouncementAdminApiQuery(new URLSearchParams("visibility="+visibility))?.visibility).toBe(visibility);
  }
 });
 it("rejects unknown read state",()=>expect(announcementAdminListSchema.safeParse({visibility:"ARCHIVED"}).success).toBe(false));
 it("does not silently accept nonpersisted visibility in mutation",()=>expect(announcementUpdateSchema.safeParse({expectedVersion:0,visibility:"DELETED"}).success).toBe(false));
});
