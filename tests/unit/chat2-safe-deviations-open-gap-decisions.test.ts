import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {publicMetricRelease} from "@/modules/placements/public-metric-release";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Safety justified deviations from legacy TPO UI",()=>{
 it("TPO-campaigns-public-37 releases no identifying small-cohort aggregate and never invents a placed tally",()=>{
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:4,count:4})).toBeNull();
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:10,count:4})).toBeNull();
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:10,count:11})).toBeNull();
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:10,count:5})).toBe(5);
  const stats=src("src/modules/placements/public-page/read-service.ts");
  expect(stats).toContain('placedAt === "SELECTED" ? null');
  expect(stats).toContain("publicPublicationFresh");
 });
 it("TPO-inbox-team-42 uses directly linked accessible mobile conversation pages rather than an inaccessible miniature three-pane view",()=>{
  const inbox=src("src/app/(authenticated)/tpo/team/page.tsx");
  const thread=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  expect(inbox).toContain("Internal conversations");
  expect(inbox).toContain('href={"/tpo/team/"+');
  expect(thread).toContain("All conversations");
  expect(thread).toContain("max-w-[88%]");
  expect(thread).toContain("TpoTeamThreadDetails");
 });
 it("TPO-inbox-team-R02 requires explicit TPO permissions for recruiter messages and announcements rather than extending college-admin private-access by guess",()=>{
  const messages=src("src/modules/placements/tpo-messages-service.ts");
  const notices=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(messages).toContain('hasMembershipRole(context, "TPO")');
  expect(notices).toContain('hasMembershipRole(context,"TPO")');
  expect(messages).toContain("requirePlacementManageScope");
 });
 it("TPO-inbox-team-R06 fans event alerts out only to the active TPO roster at emission, avoiding newly added staff reading prior personal notices",()=>{
  const joined=src("src/modules/placements/public-join/join-service.ts");
  const messages=src("src/modules/placements/recruiter-message-tpo-notification-service.ts");
  expect(joined).toContain('eq(collegeMemberships.status, "ACTIVE")');
  expect(joined).toContain('eq(membershipRoles.role, "TPO")');
  expect(messages).toContain("inAppNotifications");
  expect(messages).toContain("college");
 });
});