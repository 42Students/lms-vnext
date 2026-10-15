import {describe,it,expect} from "vitest";
import {parseTrackerActivityCursorParams as parse,trackerActivityCursorSchema as schema} from "@/modules/bug-tracker/admin-detail-cursor-model";
const id="123e4567-e89b-42d3-a456-426614174000",time="2026-10-15T11:30:00Z";
describe("DB10 private attachment metadata paging",()=>{
 it("allows independent attachment paging",()=>{
  const parsed=parse({attachmentBeforeCreatedAt:time,attachmentBeforeId:id});
  expect(parsed?.attachmentBeforeCreatedAt).toBe(time);
  expect(schema.parse(parsed).attachmentBeforeCreatedAt).toBeInstanceOf(Date);
 });
 it("preserves activity cursor alongside attachment cursor",()=>{
  const parsed=parse({attachmentBeforeCreatedAt:time,attachmentBeforeId:id,activityBeforeCreatedAt:time,activityBeforeId:id});
  expect(parsed).not.toBeNull();
 });
 it.each([{attachmentBeforeId:id},{attachmentBeforeCreatedAt:time},{attachmentBeforeCreatedAt:"invalid",attachmentBeforeId:id},{attachmentBeforeCreatedAt:time,attachmentBeforeId:"bad"}])("rejects incomplete/invalid cursor %#",raw=>{
  expect(parse(raw)).toBeNull();
 });
});
