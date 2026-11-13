import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ActivityServiceError } from "@/modules/activity/errors";
import {
  countOwnUnreadNotifications,
  createStaffNotification,
  deleteStaffNotification,
  listOwnNotifications,
  markAllOwnNotificationsRead,
  markOwnNotificationRead,
  updateStaffNotification,
} from "@/modules/activity/notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { contextFor, deletePerson, insertPerson as insertActor, person, type Person, type TestRole } from "../support/actors";

/**
 * Notifications: object-level access between people of the SAME college.
 *
 * Learner A and learner B each hold one personal notification. Nobody may read, count, acknowledge or bulk-acknowledge anyone
 * else's; a foreign notification must look exactly like a missing one; and notices published to a class (the staff side) cannot
 * be created, changed or withdrawn by a learner or a TPO. A refusal must be an access answer, never a validation error.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-notifications needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const college = SEED_IDS.collegeA;
const a = person();
const b = person();
const tpoP = person();
const facultyP = person();
const people = [a, b, tpoP, facultyP];
const eventA = randomUUID();
const eventB = randomUUID();
const noteA = randomUUID();
const noteB = randomUUID();
const label = "SEC-NTF-" + randomUUID().slice(0, 8);

const as = (p: Person, role: TestRole, collegeId: string = college): RequestContext => contextFor(p, role, collegeId, "sec-ntf");
const insertPerson = (p: Person, role: string, name: string) => insertActor(pool, p, role, name, college, "sec-ntf");
const learnerA = as(a, "LEARNER");
const learnerB = as(b, "LEARNER");
const tpo = as(tpoP, "TPO");
const faculty = as(facultyP, "FACULTY");

async function refused(call: Promise<unknown>, who: string, expected: Array<new (...args: never[]) => Error> = [ActivityServiceError, AuthorizationError]) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  expect(expected.some((type) => error instanceof type), who + ": " + String(error)).toBe(true);
  return error as Error & { code?: string };
}

const readAt = async (id: string) =>
  (await pool.query("SELECT read_at FROM in_app_notifications WHERE id=$1", [id])).rows[0]?.read_at ?? null;
const eventCount = async () =>
  Number((await pool.query("SELECT count(*)::int AS n FROM activity_events WHERE summary LIKE $1", [label + "%"])).rows[0].n);

const draft = (title: string) => ({ title, htmlContent: "<p>" + label + "</p>", classId: randomUUID() });

describe("notifications: nobody can reach another person's notifications", () => {
  beforeAll(async () => {
    await insertPerson(a, "LEARNER", "SEC-NTF Learner A");
    await insertPerson(b, "LEARNER", "SEC-NTF Learner B");
    await insertPerson(tpoP, "TPO", "SEC-NTF TPO");
    await insertPerson(facultyP, "FACULTY", "SEC-NTF Faculty");
    for (const [event, summary] of [[eventA, label + " for A"], [eventB, label + " for B"]] as const) {
      await pool.query(
        "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,importance,subject_type,subject_id,summary) VALUES($1::uuid,$2,$3,$4,'ACADEMICS','academics.program.updated','NORMAL','sec_ntf_witness',$1::text,$5)",
        [event, SEED_IDS.organization, college, SEED_IDS.collegeAdminUser, summary],
      );
    }
    await pool.query("INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,$4,$5)", [noteA, a.user, eventA, label + " title A", "Private to A"]);
    await pool.query("INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,$4,$5)", [noteB, b.user, eventB, label + " title B", "Private to B"]);
  }, 60_000);

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM in_app_notifications WHERE id=ANY($1::uuid[])", [[noteA, noteB]]).catch(() => undefined);
      // activity_events is append-only: the fixture events are intentionally kept. Their people are kept with them by foreign keys.
      for (const p of people) await deletePerson(pool, p);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 60_000);

  describe("the personal inbox", () => {
    it("each learner lists their own notification and never a classmate's", async () => {
      const mine = JSON.stringify(await listOwnNotifications(learnerA));
      const theirs = JSON.stringify(await listOwnNotifications(learnerB));
      expect(mine).toContain(noteA);
      expect(mine).not.toContain(noteB);
      expect(mine).not.toContain("Private to B");
      expect(theirs).toContain(noteB);
      expect(theirs).not.toContain(noteA);
      expect(theirs).not.toContain("Private to A");
    });

    it("the unread count covers only the caller's own notifications", async () => {
      const a1 = await countOwnUnreadNotifications(learnerA);
      expect(typeof a1 === "number" ? a1 : (a1 as { count: number }).count).toBeGreaterThanOrEqual(1);
      // Reading A's notification must not change B's count.
      const before = JSON.stringify(await countOwnUnreadNotifications(learnerB));
      await markOwnNotificationRead(learnerA, noteA);
      expect(JSON.stringify(await countOwnUnreadNotifications(learnerB))).toBe(before);
    });
  });

  describe("acknowledging", () => {
    it("a classmate cannot mark someone else's notification read, and a foreign one looks exactly like a missing one", async () => {
      const missing = await refused(markOwnNotificationRead(learnerB, randomUUID()), "B on a missing id");
      const foreign = await refused(markOwnNotificationRead(learnerB, noteA), "B on A's notification");
      expect(foreign.code).toBe(missing.code);
      expect(foreign.code).toBe("NOTIFICATION_NOT_FOUND");
    });

    it("the owner can acknowledge their own, and 'mark all read' touches only the caller's rows", async () => {
      // noteA was read in the unread-count test above; B's is still unread and only B can change it.
      expect(await readAt(noteA)).not.toBeNull();
      expect(await readAt(noteB)).toBeNull();
      await markAllOwnNotificationsRead(learnerA);
      expect(await readAt(noteB), "A's bulk acknowledgement must not touch B's notification").toBeNull();
      await markAllOwnNotificationsRead(learnerB);
      expect(await readAt(noteB)).not.toBeNull();
    });
  });

  describe("notices published to a class", () => {
    it("learners, a TPO and faculty with no class cannot publish one, and nothing is written", async () => {
      const before = await eventCount();
      for (const [who, actor] of [["learner A", learnerA], ["learner B", learnerB], ["tpo", tpo]] as const) {
        await refused(createStaffNotification(actor, draft(label + " from " + who)), who + " publishing");
      }
      // Faculty may publish only to a class they teach: an unknown class must be refused, not accepted.
      await refused(createStaffNotification(faculty, draft(label + " from faculty")), "faculty with no such class");
      expect(await eventCount()).toBe(before);
    });

    it("learners and a TPO cannot change or withdraw a notice", async () => {
      for (const [who, actor] of [["learner A", learnerA], ["learner B", learnerB], ["tpo", tpo]] as const) {
        await refused(updateStaffNotification(actor, eventA, { ...draft(label + " edit") }), who + " editing");
        await refused(deleteStaffNotification(actor, eventA), who + " withdrawing");
      }
      const survived = await pool.query("SELECT metadata FROM activity_events WHERE id=$1", [eventA]);
      expect(JSON.stringify(survived.rows[0]?.metadata ?? {})).not.toContain("deletedAt");
    });
  });
});
