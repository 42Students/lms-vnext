import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { expect, test } from "@playwright/test";
import { E2E_IDENTITY_COOKIE_NAME, E2E_SECRET_COOKIE_NAME } from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.E2E_DATABASE_URL;
const secret = process.env.E2E_AUTH_SECRET;
const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(databaseUrl && secret);
const baseUrl = "http://localhost:3000";

test.describe("UX-G001 shared notification inbox — actual two-college recipient evidence", () => {
  test.skip(!enabled, "Only disposable PostgreSQL17 with ephemeral E2E identities");
  for (const size of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ] as const) {
    test(size.name + " selection, search, dialog, cancel/read and foreign-college denial", async ({page,context}, info) => {
      test.setTimeout(120_000);
      const pool = new Pool({connectionString:databaseUrl!,max:1});
      const suffix = randomUUID();
      const ids = {
        user:randomUUID(), membershipA:randomUUID(), membershipB:randomUUID(),
        eventA:randomUUID(), eventA2:randomUUID(), eventB:randomUUID(),
        receiptA:randomUUID(), receiptA2:randomUUID(), receiptB:randomUUID(),
      };
      const uid="g001-notification-"+suffix;
      const titleA="G001 College A course "+suffix;
      const titleA2="G001 College A second "+suffix;
      const titleB="G001 Foreign College B private "+suffix;
      try {
        await pool.query(
          "insert into users (id,identity_uid,email,display_name,platform_status) values ($1,$2,$3,$4,'ACTIVE')",
          [ids.user,uid,uid+"@example.invalid","Shared notifications E2E"]);
        for (const [membership,college] of [[ids.membershipA,SEED_IDS.collegeA],[ids.membershipB,SEED_IDS.collegeB]]) {
          await pool.query(
            "insert into college_memberships (id,user_id,college_id,status) values ($1::uuid,$2::uuid,$3::uuid,'ACTIVE')",
            [membership,ids.user,college]);
          await pool.query(
            "insert into membership_roles (id,membership_id,role) values ($1::uuid,$2::uuid,'FACULTY')",
            [randomUUID(),membership]);
        }
        for (const [eventId,membership,college,title] of [
          [ids.eventA,ids.membershipA,SEED_IDS.collegeA,titleA],
          [ids.eventA2,ids.membershipA,SEED_IDS.collegeA,titleA2],
          [ids.eventB,ids.membershipB,SEED_IDS.collegeB,titleB],
        ]) await pool.query(
          "insert into activity_events (id,organization_id,college_id,actor_user_id,actor_membership_id,module,event_type,subject_type,subject_id,summary) values ($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,'COURSES','courses.discussion.posted','notification_e2e',$6::text,$7::text)",
          [eventId,SEED_IDS.organization,college,ids.user,membership,eventId,title]);
        for (const [id,eventId,title] of [
          [ids.receiptA,ids.eventA,titleA],
          [ids.receiptA2,ids.eventA2,titleA2],
          [ids.receiptB,ids.eventB,titleB],
        ]) await pool.query(
          "insert into in_app_notifications (id,user_id,event_id,title,body) values ($1::uuid,$2::uuid,$3::uuid,$4::text,$5::text)",
          [id,ids.user,eventId,title,"Scoped notification details for "+title]);

        await context.addCookies([
          {name:E2E_IDENTITY_COOKIE_NAME,value:uid,url:baseUrl,httpOnly:true,sameSite:"Lax"},
          {name:E2E_SECRET_COOKIE_NAME,value:secret!,url:baseUrl,httpOnly:true,sameSite:"Lax"},
          {name:"lms_membership",value:ids.membershipA,url:baseUrl,httpOnly:true,sameSite:"Lax"},
          {name:"lms_role",value:"FACULTY",url:baseUrl,httpOnly:true,sameSite:"Lax"},
        ]);
        await page.setViewportSize(size);
        await page.goto("/notifications");
        await expect(page.getByRole("heading",{name:"Notifications",level:1})).toBeVisible();
        await expect(page.getByText(titleA,{exact:true})).toBeVisible();
        await expect(page.getByText(titleA2,{exact:true})).toBeVisible();
        await expect(page.getByText(titleB,{exact:true})).toHaveCount(0);
        await expect(page.getByRole("group",{name:"Notification filter"}).getByRole("link",{name:"Unread (2)"})).toBeVisible();
        await expect(page.getByRole("navigation",{name:"Notification categories"})).toBeVisible();

        await page.getByRole("button",{name:new RegExp("View G001 College A course "+suffix)}).click();
        const details=page.getByRole("dialog",{name:titleA});
        await expect(details).toBeVisible();
        await expect(details).toContainText("Scoped notification details");
        await details.getByRole("button",{name:"Got it"}).click();
        await expect(details).toHaveCount(0);

        await page.goto("/notifications?view=all&q="+encodeURIComponent("no-such-unique-"+suffix));
        await expect(page.getByText("No notifications match your search")).toBeVisible();
        await expect(page.getByRole("link",{name:"Clear search"}).first()).toHaveAttribute("href",/notifications/);
        await page.goto("/notifications?view=all&category=FORGED");
        await expect(page.getByText(/notification filters or page link are invalid/)).toBeVisible();
        await expect(page.getByText(titleA,{exact:true})).toHaveCount(0);
        await page.goto("/notifications?view=all&beforeId="+ids.receiptA);
        await expect(page.getByText(/notification filters or page link are invalid/)).toBeVisible();

        await page.goto("/notifications?view=all");
        const first=page.getByRole("article").filter({hasText:titleA}).first();
        const one=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname==="/api/notifications/"+ids.receiptA+"/read");
        await first.getByRole("button",{name:"Mark read"}).click();
        expect((await one).ok()).toBe(true);
        await expect(page.getByRole("group",{name:"Notification filter"}).getByRole("link",{name:"Unread (1)"})).toBeVisible();

        await page.getByRole("button",{name:"Mark all as read"}).click();
        const confirm=page.getByRole("alertdialog",{name:"Mark all as read"});
        await expect(confirm).toContainText("including items hidden by the current filters");
        await confirm.getByRole("button",{name:"Cancel"}).click();
        await expect(page.getByRole("link",{name:"Unread (1)"})).toBeVisible();
        await page.getByRole("button",{name:"Mark all as read"}).click();
        const all=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname==="/api/notifications/read-all");
        await page.getByRole("alertdialog",{name:"Mark all as read"}).getByRole("button",{name:"Mark all as read"}).click();
        expect((await all).ok()).toBe(true);
        await expect(page.getByRole("link",{name:"Unread (0)"})).toBeVisible();
        expect((await pool.query("select read_at from in_app_notifications where id=$1",[ids.receiptB])).rows[0]?.read_at).toBeNull();

        await context.addCookies([{name:"lms_membership",value:ids.membershipB,url:baseUrl,httpOnly:true,sameSite:"Lax"}]);
        await page.reload();
        await expect(page.getByText(titleB,{exact:true})).toBeVisible();
        await expect(page.getByText(titleA,{exact:true})).toHaveCount(0);
        const forbidden=await page.request.post("/api/notifications/"+ids.receiptA+"/read");
        expect([403,404]).toContain(forbidden.status());
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
        await page.screenshot({path:info.outputPath("g001-"+size.name+"-college-b.png"),fullPage:true});
      } finally {
        await pool.query("delete from in_app_notifications where id=any($1::uuid[])",[[ids.receiptA,ids.receiptA2,ids.receiptB]]);
        // Audit activity events are immutable, and the disposable DB is destroyed after CI.
        await pool.end();
      }
    });
  }
});
