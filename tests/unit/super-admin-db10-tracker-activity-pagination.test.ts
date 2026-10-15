import {describe,it,expect} from "vitest";
import {parseTrackerActivityCursorParams as parse,trackerActivityCursorSchema as schema} from "@/modules/bug-tracker/admin-detail-cursor-model";
const id="123e4567-e89b-42d3-a456-426614174000",stamp="2026-10-15T10:30:00Z";
describe("DB10 tracker activity keyset pagination",()=>{
 it("accepts current page",()=>expect(parse({})).toEqual({activityBeforeCreatedAt:undefined,activityBeforeId:undefined}));
 it("keeps raw ISO across service boundary",()=>{
  const result=parse({activityBeforeCreatedAt:stamp,activityBeforeId:id});
  expect(result?.activityBeforeCreatedAt).toBe(stamp);
  expect(schema.parse(result).activityBeforeCreatedAt).toBeInstanceOf(Date);
 });
 it.each([{activityBeforeId:id},{activityBeforeCreatedAt:stamp},{activityBeforeId:"broken",activityBeforeCreatedAt:stamp},{other:"1"},{activityBeforeId:[id,id]}])("denies malformed bookmark %#",input=>{
  expect(parse(input)).toBeNull();
 });
});
