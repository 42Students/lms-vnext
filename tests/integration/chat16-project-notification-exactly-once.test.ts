import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { getDb, closeDatabaseConnection } from "@/db/client";
import { activityEvents } from "@/db/schema";
import { deliverInAppNotification } from "@/modules/activity/notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const events: string[] = [];
const newProjectEvent = async (collegeId: string) => {
  const [event] = await getDb().insert(activityEvents).values({
    organizationId: SEED_IDS.organization,
    collegeId,
    actorUserId: SEED_IDS.facultyUser,
    module: "PROJECTS",
    eventType: "projects.chat16.notification.checked",
    subjectType: "chat16_project_notification",
    subjectId: randomUUID(),
    summary: "Scoped project notification delivery",
    metadata: { chat16: true },
  }).returning({ id: activityEvents.id });
  if (!event) throw new Error("Missing notification test event");
  events.push(event.id);
  return event.id;
};
const notice = {
  title: "Project task updated",
  body: "Open your assigned project to review this change.",
  actionHref: "/learn/projects",
};
async function rowsFor(eventId: string) {
  return pool!.query<{ user_id: string; event_id: string }>(
    "select user_id,event_id from in_app_notifications where event_id=$1::uuid",
    [eventId],
  );
}
describe.skipIf(!enabled)("PROJ-BREAK-chat16 real PostgreSQL notice dedupe and tenancy", () => {
  afterAll(async () => {
    try {
      for (const id of events) {
        await pool!.query("delete from in_app_notifications where event_id=$1::uuid", [id]);
        await pool!.query("delete from activity_events where id=$1::uuid", [id]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("PROJ-BREAK-NOTIFY-PG-01 concurrent workers create one recipient-event bell, not two", async () => {
    const eventId = await newProjectEvent(SEED_IDS.collegeA);
    const attempts = await Promise.all([
      deliverInAppNotification(eventId, [SEED_IDS.learnerUser], notice),
      deliverInAppNotification(eventId, [SEED_IDS.learnerUser], notice),
    ]);
    expect(attempts.reduce((sum, x) => sum + x.delivered, 0)).toBe(1);
    expect(attempts.reduce((sum, x) => sum + x.skippedDuplicate, 0)).toBe(1);
    const rows = (await rowsFor(eventId)).rows;
    expect(rows).toEqual([{
      user_id: SEED_IDS.learnerUser, event_id: eventId,
    }]);
    const replay = await deliverInAppNotification(eventId, [SEED_IDS.learnerUser], notice);
    expect(replay).toMatchObject({ delivered: 0, skippedDuplicate: 1 });
  });

  it("PROJ-BREAK-NOTIFY-PG-02 wrong-college member cannot receive private project notice", async () => {
    const eventId = await newProjectEvent(SEED_IDS.collegeB);
    await expect(deliverInAppNotification(
      eventId, [SEED_IDS.learnerUser], notice,
    )).rejects.toMatchObject({ code: "NOTIFICATION_SCOPE_MISMATCH" });
    expect((await rowsFor(eventId)).rows).toEqual([]);
  });

  it("PROJ-BREAK-NOTIFY-PG-03 mixed-college recipients fail whole delivery, not partial leak", async () => {
    const eventId = await newProjectEvent(SEED_IDS.collegeB);
    await expect(deliverInAppNotification(eventId,
      [SEED_IDS.facultyUser, SEED_IDS.learnerUser], notice,
    )).rejects.toMatchObject({ code: "NOTIFICATION_SCOPE_MISMATCH" });
    expect((await rowsFor(eventId)).rows).toEqual([]);
  });
});
