import {describe,it,expect} from "vitest";
import {tpoInboxEmptyNavigation} from "../../src/modules/activity/tpo-notifications-model";
describe("TPO unread notification empty state",()=>{
 it("offers all-notifications link only when unread is empty",()=>{
  expect(tpoInboxEmptyNavigation("unread",0)).toEqual({label:"View all notifications",href:"/tpo/notifications?view=all"});
  expect(tpoInboxEmptyNavigation("unread",1)).toBeNull();
  expect(tpoInboxEmptyNavigation("all",0)).toBeNull();
 });
});
