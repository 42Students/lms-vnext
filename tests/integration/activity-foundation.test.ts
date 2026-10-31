import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  groupActivityEvents,
  listActivityEvents,
  recordActivityEvent,
} from "@/modules/activity/service";
import {
  deliverInAppNotification,
  listOwnNotifications,
  markOwnNotificationRead,
} from "@/modules/activity/notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

const facultyB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from in_app_notifications",
  );
  await pool.query(
    "delete from activity_events",
  );
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Activity and notification foundation", () => {
  it("records idempotent tenant-scoped events and groups nearby noise", async () => {
    const first =
      await recordActivityEvent(
        collegeAdmin,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
          collegeId: SEED_IDS.collegeA,
          subjectType:
            "placement_job",
          subjectId: "job-a",
          subjectLabel:
            "Graduate Engineer",
          summary:
            "Graduate Engineer published",
          groupKey:
            "placement-job:job-a",
          dedupeKey:
            "job-a:published",
          occurredAt: new Date(
            "2026-10-04T08:00:00.000Z",
          ),
        },
      );

    const repeated =
      await recordActivityEvent(
        collegeAdmin,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
          collegeId: SEED_IDS.collegeA,
          subjectType:
            "placement_job",
          subjectId: "job-a",
          summary:
            "Duplicate should not be inserted",
          dedupeKey:
            "job-a:published",
        },
      );
    expect(repeated.id).toBe(first.id);

    await recordActivityEvent(
      collegeAdmin,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
        collegeId: SEED_IDS.collegeA,
        subjectType:
          "placement_job",
        subjectId: "job-b",
        summary:
          "Second related placement update",
        groupKey:
          "placement-job:job-a",
        occurredAt: new Date(
          "2026-10-04T07:50:00.000Z",
        ),
      },
    );

    await recordActivityEvent(
      facultyB,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PROJECTS_TASK_SUBMITTED,
        collegeId: SEED_IDS.collegeB,
        subjectType:
          "project_task",
        subjectId: "task-b",
        summary:
          "College B project task submitted",
      },
    );

    const result =
      await listActivityEvents(
        collegeAdmin,
        {
          module: "PLACEMENTS",
          limit: 20,
        },
      );

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (row) =>
          row.event.collegeId ===
          SEED_IDS.collegeA,
      ),
    ).toBe(true);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.count).toBe(2);

    await expect(
      listActivityEvents(learner),
    ).rejects.toThrow(
      "Missing permission: activity.read",
    );
  });

  it("DB014 rejects cross-college dedupe collisions without returning another tenant's activity event", async () => {
    const dedupeKey = "db014-foreign-tenant-collision";
    const first = await recordActivityEvent(collegeAdmin, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
      collegeId: SEED_IDS.collegeA,
      subjectType: "placement_job",
      subjectId: "shared-collision-subject",
      summary: "College A private event",
      metadata: {privateCollege: "A"},
      dedupeKey,
    });

    await expect(recordActivityEvent(facultyB, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
      collegeId: SEED_IDS.collegeB,
      subjectType: "placement_job",
      subjectId: "shared-collision-subject",
      summary: "College B must not receive college A metadata",
      dedupeKey,
    })).rejects.toMatchObject({code: "ACTIVITY_SCOPE_MISMATCH"});

    const {rows} = await pool.query(
      "select id,college_id,actor_user_id from activity_events where dedupe_key=$1",
      [dedupeKey],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: first.id, college_id: SEED_IDS.collegeA,
      actor_user_id: SEED_IDS.collegeAdminUser,
    });
  });

  it("DB014 rejects same-college idempotency collisions across subjects and actors", async () => {
    const dedupeKey = "db014-subject-actor-collision";
    const input = {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
      collegeId: SEED_IDS.collegeA,
      subjectType: "placement_job",
      subjectId: "job-a",
      summary: "Exact idempotency envelope",
      dedupeKey,
    } as const;
    const first = await recordActivityEvent(collegeAdmin, input);
    expect((await recordActivityEvent(collegeAdmin, {
      ...input, summary: "Same actor, subject and event is a retry",
    })).id).toBe(first.id);

    await expect(recordActivityEvent(collegeAdmin, {
      ...input, subjectId: "job-b",
    })).rejects.toMatchObject({code: "ACTIVITY_SCOPE_MISMATCH"});
    await expect(recordActivityEvent(learner, {
      ...input,
    })).rejects.toMatchObject({code: "ACTIVITY_SCOPE_MISMATCH"});

    const {rows} = await pool.query(
      "select id,college_id,actor_user_id,subject_id from activity_events where dedupe_key=$1",
      [dedupeKey],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: first.id, college_id: SEED_IDS.collegeA,
      actor_user_id: SEED_IDS.collegeAdminUser,
      subject_id: "job-a",
    });
  });

  it("delivers self-scoped in-app notifications idempotently and enforces read ownership", async () => {
    const event =
      await recordActivityEvent(
        collegeAdmin,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_ISSUED,
          collegeId: SEED_IDS.collegeA,
          subjectType:
            "placement_offer",
          subjectId: "offer-1",
          summary:
            "An offer was issued",
          dedupeKey:
            "offer-1:issued",
        },
      );

    const firstDelivery =
      await deliverInAppNotification(
        event.id,
        [SEED_IDS.learnerUser],
        {
          title:
            "Placement offer received",
          body:
            "Review and respond to your placement offer.",
          actionHref:
            "/learn/placements",
        },
      );
    expect(firstDelivery.delivered).toBe(1);

    await deliverInAppNotification(
      event.id,
      [SEED_IDS.learnerUser],
      {
        title:
          "Placement offer received",
        body:
          "Review and respond to your placement offer.",
        actionHref:
          "/learn/placements",
      },
    );

    const notifications =
      await listOwnNotifications(
        learner,
      );
    expect(notifications).toHaveLength(1);
    expect(
      notifications[0]?.notification
        .readAt,
    ).toBeNull();

    const read =
      await markOwnNotificationRead(
        learner,
        notifications[0]!.notification.id,
      );
    expect(read.readAt).not.toBeNull();

    await expect(
      markOwnNotificationRead(
        collegeAdmin,
        notifications[0]!.notification.id,
      ),
    ).rejects.toMatchObject({
      code: "NOTIFICATION_NOT_FOUND",
    });
  });
});
