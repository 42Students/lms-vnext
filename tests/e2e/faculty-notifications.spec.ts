import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { expect, test } from "@playwright/test";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const BASE_URL = "http://localhost:3000";
const databaseUrl = process.env.E2E_DATABASE_URL;
const secret = process.env.E2E_AUTH_SECRET;

// Never set up or tear down Faculty browser fixtures against an ordinary DB.
test.skip(
  !secret || !databaseUrl || process.env.E2E_AUTH_ENABLED !== "true",
  "Isolated Faculty notification browser proof requires E2E auth and E2E_DATABASE_URL",
);

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]) {
test("Faculty notifications "+viewport.name+" stay within the selected college, including read actions", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  const pool = new Pool({ connectionString: databaseUrl!, max: 1 });
  const suffix = randomUUID();
  const userId = randomUUID();
  const membershipA = randomUUID();
  const membershipB = randomUUID();
  const eventA1 = randomUUID();
  const eventA2 = randomUUID();
  const eventB = randomUUID();
  const notificationA1 = randomUUID();
  const notificationA2 = randomUUID();
  const notificationB = randomUUID();
  const announcementA = randomUUID(), announcementB = randomUUID();
  const announcementTitleA = "Faculty College A announcement " + suffix;
  const announcementTitleB = "Faculty College B announcement " + suffix;
  const identityUid = "faculty-e2e-notifications-" + suffix;
  const noticeA1 = "Faculty College A notice one " + suffix;
  const noticeA2 = "Faculty College A notice two " + suffix;
  const noticeB = "Faculty College B secret " + suffix;

  try {
    await pool.query(
      "insert into users (id, identity_uid, email, display_name, platform_status) values ($1,$2,$3,$4,'ACTIVE')",
      [userId, identityUid, "faculty-e2e-" + suffix + "@example.invalid", "Faculty e2e Notifications"],
    );
    for (const [membershipId, collegeId] of [
      [membershipA, SEED_IDS.collegeA],
      [membershipB, SEED_IDS.collegeB],
    ]) {
      await pool.query(
        "insert into college_memberships (id, user_id, college_id, status) values ($1,$2,$3,'ACTIVE')",
        [membershipId, userId, collegeId],
      );
      await pool.query(
        "insert into membership_roles (id, membership_id, role) values ($1,$2,'FACULTY')",
        [randomUUID(), membershipId],
      );
    }
    for (const [eventId, membershipId, collegeId] of [
      [eventA1, membershipA, SEED_IDS.collegeA],
      [eventA2, membershipA, SEED_IDS.collegeA],
      [eventB, membershipB, SEED_IDS.collegeB],
    ]) {
      await pool.query(
        "insert into activity_events (id, organization_id, college_id, actor_user_id, actor_membership_id, module, event_type, subject_type, subject_id, summary) values ($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,'COURSES','courses.discussion.posted','faculty_notification_e2e',$6::text,'Faculty notification test')",
        [eventId, SEED_IDS.organization, collegeId, userId, membershipId, eventId],
      );
    }
    for (const [id, eventId, title] of [
      [notificationA1, eventA1, noticeA1],
      [notificationA2, eventA2, noticeA2],
      [notificationB, eventB, noticeB],
    ]) {
      await pool.query(
        "insert into in_app_notifications (id, user_id, event_id, title, body) values ($1,$2,$3,$4,$5)",
        [id, userId, eventId, title, "Recipient-visible course event"],
      );
    }

    // Actual announcement table, not a mocked browser-only card.
    for(const [id,collegeId,title] of [
      [announcementA,SEED_IDS.collegeA,announcementTitleA],
      [announcementB,SEED_IDS.collegeB,announcementTitleB],
    ])await pool.query(
      "insert into announcements (id,organization_id,college_id,receiver_type,receiver_id,title,message,sender_user_id,sender_type) values ($1::uuid,$2::uuid,$3::uuid,'COLLEGE',$4::uuid,$5::text,$6::text,$7::uuid,'FACULTY')",
      [id,SEED_IDS.organization,collegeId,collegeId,title,"College-scoped notice",userId],
    );

    await context.addCookies([
      { name: "lms_role", value: "FACULTY", url: BASE_URL, httpOnly: true, sameSite: "Lax" },
      { name: E2E_IDENTITY_COOKIE_NAME, value: identityUid, url: BASE_URL, httpOnly: true, sameSite: "Lax" },
      { name: E2E_SECRET_COOKIE_NAME, value: secret!, url: BASE_URL, httpOnly: true, sameSite: "Lax" },
      { name: "lms_membership", value: membershipA, url: BASE_URL, httpOnly: true, sameSite: "Lax" },
    ]);
    await page.goto("/teacher/notifications");
    await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
    await expect(page.getByText(noticeA1, { exact: true })).toBeVisible();
    await expect(page.getByText(noticeA2, { exact: true })).toBeVisible();
    await expect(page.getByText(noticeB, { exact: true })).toHaveCount(0);
    await expect(page.getByText(announcementTitleA,{exact:true})).toBeVisible();
    await expect(page.getByText(announcementTitleB,{exact:true})).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Unread (2)" })).toBeVisible();
    // The five legacy tabs remain navigable; Personal must not widen to
    // foreign-college events, and returning to All must restore the feed.
    await page.getByRole("navigation",{name:"Notification categories"})
      .getByRole("link",{name:/Personal/}).click();
    await expect(page).toHaveURL(/tab=personal/);
    await expect(page.getByText(noticeA1,{exact:true})).toBeVisible();
    await expect(page.getByText(noticeB,{exact:true})).toHaveCount(0);
    await expect(page.getByText(announcementTitleA,{exact:true})).toHaveCount(0);
    await page.getByRole("navigation",{name:"Notification categories"})
      .getByRole("link",{name:/All/}).click();
    await expect(page).toHaveURL(/\/teacher\/notifications\?view=all$/);
    await expect(page.getByText(noticeA1,{exact:true})).toBeVisible();
    await expect(page.getByText(announcementTitleA,{exact:true})).toBeVisible();

    const first = page.getByRole("article").filter({ hasText: noticeA1 });
    const marked = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/notifications/faculty/" + notificationA1 + "/read",
    );
    await first.getByRole("button", { name: "Mark read" }).click();
    expect((await marked).ok()).toBe(true);
    await expect(page.getByRole("link", { name: "Unread (1)" })).toBeVisible();
    await page.getByRole("group",{name:"Notification filter"})
      .getByRole("link",{name:/Unread/}).click();
    await expect(page).toHaveURL(/view=unread/);
    await expect(page.getByText(noticeA1,{exact:true})).toHaveCount(0);
    await expect(page.getByText(noticeA2,{exact:true})).toBeVisible();
    await expect(page.getByText(announcementTitleA,{exact:true})).toHaveCount(0);
    await page.getByRole("group",{name:"Notification filter"})
      .getByRole("link",{name:"All",exact:true}).click();
    await expect(page.getByText(noticeA1,{exact:true})).toBeVisible();

    const markAll = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/notifications/faculty/read-all",
    );
    await page.getByRole("button", { name: "Mark all as read" }).click();
    expect((await markAll).ok()).toBe(true);
    await expect(page.getByRole("link", { name: "Unread (0)" })).toBeVisible();

    const stillUnread = await pool.query(
      "select read_at from in_app_notifications where id = $1",
      [notificationB],
    );
    expect(stillUnread.rows[0]?.read_at).toBeNull();

    await context.addCookies([
      { name: "lms_membership", value: membershipB, url: BASE_URL, httpOnly: true, sameSite: "Lax" },
    ]);
    await page.reload();
    await expect(page.getByText(noticeB, { exact: true })).toBeVisible();
    await expect(page.getByText(noticeA1, { exact: true })).toHaveCount(0);
    await expect(page.getByText(announcementTitleB,{exact:true})).toBeVisible();
    await expect(page.getByText(announcementTitleA,{exact:true})).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Unread (1)" })).toBeVisible();

    const deniedStatus = await page.evaluate(async (id) => {
      const response = await fetch("/api/notifications/faculty/" + id + "/read", { method: "POST" });
      return response.status;
    }, notificationA1);
    expect(deniedStatus).toBeGreaterThanOrEqual(400);
  } finally {
    await pool.query("delete from announcements where id = any($1::uuid[])",[[announcementA,announcementB]]);
    await pool.query("delete from in_app_notifications where id = any($1::uuid[])", [[notificationA1, notificationA2, notificationB]]);
    // activity_events is immutable. Preserve its audit actor and membership
    // references in this disposable E2E database; never purge the history.
    // Dedicated UUIDs guarantee fixture isolation from other tests.
    await pool.end();
  }
});
}
