import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoMyNotificationsQuerySchema,tpoMyNotificationsHref,
 safeTpoNotificationLabel,tpoNotificationReadStatus,
 resolveTpoNotificationPreferences,TPO_NOTIFICATION_PREFERENCE_DEFAULTS,
} from "@/modules/placements/tpo-my-notifications-model";
import {tpoStudentNoticesOverview} from "@/modules/placements/tpo-student-notices-overview-model";
import {tpoStudentNoticeNavigation} from "@/modules/placements/tpo-student-notice-navigation-model";
import {deriveTpoPrepCourseOutcome} from "@/modules/placements/tpo-prep-readiness-derivation";

const src=(path:string)=>readFileSync(path,"utf8");
const settingsDir="src/app/(authenticated)/tpo/settings/";

describe("TPO-settings-audit-NOTIFY-01 filtered personal notifications",()=>{
 it("only accepts finite decimal pages and bounded sizes; builds stable canonical next links",()=>{
  for(const hostile of ["1e2","0x10","0b1","-1"," 2","2 ","+2","NaN","Infinity","1.5"]){
   expect(tpoMyNotificationsQuerySchema.safeParse({page:hostile}).success,hostile).toBe(false);
   expect(tpoMyNotificationsQuerySchema.safeParse({pageSize:hostile}).success,hostile).toBe(false);
  }
  expect(tpoMyNotificationsQuerySchema.safeParse({page:"10001"}).success).toBe(false);
  expect(tpoMyNotificationsQuerySchema.safeParse({pageSize:"101"}).success).toBe(false);
  expect(tpoMyNotificationsQuerySchema.safeParse({view:"OTHER"}).success).toBe(false);
  expect(tpoMyNotificationsQuerySchema.safeParse({unexpected:"x"}).success).toBe(false);
  const filtered=tpoMyNotificationsQuerySchema.safeParse({view:"UNREAD",page:"0002",pageSize:"50"});
  expect(filtered.success).toBe(true);
  if(filtered.success) {
   expect(filtered.data).toEqual({view:"UNREAD",page:2,pageSize:50});
   expect(tpoMyNotificationsHref(filtered.data)).toBe("/tpo/settings/notifications?view=UNREAD&page=2&pageSize=50");
  }
  expect(tpoMyNotificationsHref({})).toBe("/tpo/settings/notifications");
 });
 it("never renders a user's stored notification content as a subject",()=>{
  expect(safeTpoNotificationLabel("PROJECTS")).toBe("Project update");
  expect(safeTpoNotificationLabel("PLACEMENTS")).toBe("Placement update");
  expect(safeTpoNotificationLabel("SECRET: student full name")).toBe("College notification");
  expect(tpoNotificationReadStatus(null)).toBe("UNREAD");
  expect(tpoNotificationReadStatus(new Date("2026-10-18T00:00:00Z"))).toBe("READ");
  const page=src(settingsDir+"notifications/page.tsx");
  expect(page).toContain("getTpoMyNotifications(");
  expect(page).toContain("hasMembershipRole(context");
  expect(page).toContain("Invalid notification filters");
  expect(page).toContain('href="/tpo/settings/notifications"');
  expect(page).toContain("item.subject");
  expect(page).not.toContain("item.body");
  expect(page).toContain('caption="My notifications"');
 });
 it("TPO-settings-audit-NOTIFY-02 scopes count/list/preference queries to user, college and organization without GET writes",()=>{
  const reader=src("src/modules/placements/tpo-my-notifications-service.ts");
  expect(reader).toContain("hasMembershipRole(context");
  expect(reader).toContain("requirePlacementManageScope(context, collegeId)");
  expect(reader).toContain("eq(inAppNotifications.userId, userId)");
  expect(reader).toContain("eq(activityEvents.collegeId, collegeId)");
  expect(reader).toContain("eq(activityEvents.organizationId, organizationId)");
  expect(reader).toContain("eq(placementTpoUserPreferences.collegeId, collegeId)");
  expect(reader).toContain("eq(placementTpoUserPreferences.userId, userId)");
  expect(reader).toContain(".where(and(...ownCollegeConditions))");
  expect(reader).toContain(".where(and(...filteredConditions))");
  expect(reader).toContain("safeTpoNotificationLabel(record.module)");
  expect(reader).not.toContain(".insert(");
  expect(reader).not.toContain(".update(");
  expect(reader).not.toContain("record.body");
  expect(reader).not.toContain("record.actionHref");
 });
 it("distinguishes unavailable storage from saved preferences and preserves defaults",()=>{
  expect(resolveTpoNotificationPreferences(false,null)).toEqual({source:"UNAVAILABLE",values:null});
  const empty=resolveTpoNotificationPreferences(true,null);
  expect(empty.source).toBe("SOURCE_DEFAULT");
  expect(empty.values).toEqual(TPO_NOTIFICATION_PREFERENCE_DEFAULTS);
  const provided={...TPO_NOTIFICATION_PREFERENCE_DEFAULTS,morningDigest:true,recruiterMessages:false};
  const stored=resolveTpoNotificationPreferences(true,provided);
  expect(stored).toEqual({source:"PERSISTED",values:provided});
  expect(stored.values).not.toBe(provided);
 });
});

describe("TPO-settings-audit-NOTICES-01 preparation and notices authoring cannot imply delivery",()=>{
 it("separates recorded notices, actual inbox and preference destinations",()=>{
  const links=tpoStudentNoticeNavigation();
  expect(links).toEqual({
   notices:"/tpo/announcements",inbox:"/tpo/notifications",
   preferences:"/tpo/settings/notifications",
  });
  const available=tpoStudentNoticesOverview({announcementsReady:true,noticeCount:4,prepReady:true});
  expect(available).toMatchObject({publishedSummary:"4 recorded college notices",
   prepSummary:"Preparation-readiness configuration available"});
  const unavailable=tpoStudentNoticesOverview({announcementsReady:false,noticeCount:999,prepReady:false});
  expect(unavailable.publishedSummary).toBe("College notices unavailable");
  expect(unavailable.prepSummary).toBe("Preparation configuration unavailable");
  expect(available.noticeHref).toBe(links.notices);
  const page=src(settingsDir+"notices/page.tsx");
  expect(page).toContain("requireTpoBatchActor(ctx)");
  expect(page).toContain("announcements.status");
  expect(page).toContain("does not enable email/SMS delivery");
  expect(page).toContain("not confirmed individual delivery or read receipts");
  expect(page).toContain("communication.ready");
 });
 it("never claims course readiness from missing, duplicated or impossible evidence",()=>{
  const policy={courseIds:["a","b"],minimumCompleted:1,progressThresholdPct:75};
  const ready=[{courseId:"a",totalContent:2,completedContent:2},
   {courseId:"b",totalContent:2,completedContent:1}];
  expect(deriveTpoPrepCourseOutcome(policy,ready)).toBe("READY");
  expect(deriveTpoPrepCourseOutcome(policy,null)).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome(policy,[ready[0]])).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome(policy,[...ready,ready[0]])).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome(policy,[{...ready[0],completedContent:3},ready[1]])).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome({...policy,courseIds:[]},null)).toBe("UNCONFIGURED");
  const page=src(settingsDir+"prep-readiness/page.tsx");
  expect(page).toContain("!coursesResult.ok");
  expect(page).toContain("!parsed.success");
  expect(page).toContain("parsed.success&&coursesResult.ok");
  expect(page).toContain("Saved choices were not changed");
 });
});
