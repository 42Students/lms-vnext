import {describe,expect,it} from "vitest";
import {parseAnnouncementAdminApiQuery as parse} from "@/modules/announcements/admin-api-query";
describe("DB10 announcement admin GET query",()=>{
 it("allows valid bounded query",()=>{expect(parse(new URLSearchParams("includeDeleted=true&limit=25"))).toMatchObject({includeDeleted:"true",limit:"25"});});
 it.each(["limit=0","limit=101","limit=NaN","includeDeleted=1","beforeId=123e4567-e89b-42d3-a456-426614174000","limit=1&limit=2","unknown=hi"])("rejects malformed or ambiguous %s",value=>{
  expect(parse(new URLSearchParams(value))).toBeNull();
 });
});
