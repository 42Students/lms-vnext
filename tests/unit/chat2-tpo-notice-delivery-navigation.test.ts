import {describe,it,expect} from "vitest";
import {tpoStudentNoticeNavigation} from "../../src/modules/placements/tpo-student-notice-navigation-model";
describe("TPO notice settings workflows",()=>{
 it("distinguishes authoring from actual personal delivery inbox",()=>{
  const links=tpoStudentNoticeNavigation();
  expect(links.notices).toBe("/tpo/announcements");
  expect(links.inbox).toBe("/tpo/notifications");
  expect(links.preferences).toBe("/tpo/settings/notifications");
  expect(new Set(Object.values(links)).size).toBe(3);
 });
});
