import {describe,expect,it} from "vitest";
import {hrNotificationsQuerySchema,HR_INBOX_PAGE_SIZE,hrInboxPageBounds} from "@/modules/placements/hr-notifications-model";
describe("HR paged notification counts",()=>{
 it("calculates exact page boundaries with fixed 25 items",()=>{
  expect(HR_INBOX_PAGE_SIZE).toBe(25);
  expect(hrInboxPageBounds(1,52)).toEqual({page:1,total:52,pageSize:25,pages:3,first:1,last:25});
  expect(hrInboxPageBounds(3,52).last).toBe(52);
  expect(hrInboxPageBounds(4,52).first).toBe(0);
 });
 it("rejects unknown scope and invalid page",()=>{
  expect(hrNotificationsQuerySchema.safeParse({page:"2",unreadOnly:"true"}).success).toBe(true);
  expect(hrNotificationsQuerySchema.safeParse({page:"0"}).success).toBe(false);
  expect(hrNotificationsQuerySchema.safeParse({page:"10001"}).success).toBe(false);
  expect(hrNotificationsQuerySchema.safeParse({companyId:"foreign"}).success).toBe(false);
 });
});
