import {describe,it,expect} from "vitest";
import {parseSuperAdminAnnouncementParams as parse} from "@/modules/announcements/super-admin-list-query";
const id="123e4567-e89b-42d3-a456-426614174000";
describe("announcement history URL validation",()=>{
 it("accepts a complete ISO cursor and deleted mode",()=>{
  expect(parse({deleted:"1",beforeId:id,beforeCreatedAt:"2026-10-15T09:00:00Z"})).toMatchObject({deleted:"1",beforeId:id});
 });
 it.each([{deleted:"false"},{deleted:["1","1"]},{unknown:"x"},{beforeId:id},{beforeCreatedAt:"2026-10-15T09:00:00Z"},{beforeId:"bad",beforeCreatedAt:"2026-10-15T09:00:00Z"}])("denies unsafe query %#",q=>{
  expect(parse(q)).toBeNull();
 });
});
