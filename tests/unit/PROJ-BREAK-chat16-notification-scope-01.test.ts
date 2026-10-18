import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { deliverInAppNotificationInTransaction } from "@/modules/activity/notification-service";
import {
  notifyActiveProjectMembers, notifyProjectMemberships, projectNoticeHref,
} from "@/modules/projects/project-notification-service";

vi.mock("@/modules/activity/notification-service", () => ({
  deliverInAppNotificationInTransaction: vi.fn(),
}));

type Writer = Parameters<typeof notifyActiveProjectMembers>[0];
const collegeId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const eventId = "33333333-3333-4333-8333-333333333333";
const sourceUser = "44444444-4444-4444-8444-444444444444";
const memberUser = "55555555-5555-4555-8555-555555555555";

function fakeWriter(rows: readonly { userId: string }[]) {
  const conditions: unknown[] = [];
  const builder = {
    innerJoin: vi.fn(),
    where: vi.fn(async (condition: unknown) => {
      conditions.push(condition);
      return rows;
    }),
  };
  builder.innerJoin.mockReturnValue(builder);
  const select = vi.fn(() => ({ from: vi.fn(() => builder) }));
  return { tx: { select } as unknown as Writer, conditions, select };
}
const notice = {
  projectId, collegeId, title: "Project updated",
  body: "Open the project for the latest information.",
  actionHref: "/mentor/projects/" + projectId,
  exceptUserId: sourceUser,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(deliverInAppNotificationInTransaction).mockResolvedValue({
    delivered: 1, skippedInactive: 0, skippedDuplicate: 0,
  });
});

describe("PROJ-BREAK-chat16 notification adversarial permission and dedupe journeys", () => {
  it("PROJ-BREAK-NOTIFY-01 encodes hostile IDs without adding query or path segments", () => {
    expect(projectNoticeHref("LEARNER", projectId)).toBe("/learn/projects/" + projectId);
    expect(projectNoticeHref("MENTOR", projectId)).toBe("/mentor/projects/" + projectId);
    const malicious = projectId + "/../../admin?collegeId=other#fragment";
    const href = projectNoticeHref("LEARNER", malicious);
    expect(href).toBe("/learn/projects/" + encodeURIComponent(malicious));
    expect(href).not.toContain("/../");
    expect(href).not.toContain("?collegeId=");
    expect(href).not.toContain("#fragment");
  });

  it("PROJ-BREAK-NOTIFY-02 explicit empty role selection never becomes broad project notification", async () => {
    const db = fakeWriter([{ userId: memberUser }]);
    expect(await notifyActiveProjectMembers(db.tx, eventId, { ...notice, roles: [] }))
      .toEqual({ delivered: 0, skippedInactive: 0, skippedDuplicate: 0 });
    expect(db.select).not.toHaveBeenCalled();
    expect(deliverInAppNotificationInTransaction).not.toHaveBeenCalled();
  });

  it("PROJ-BREAK-NOTIFY-03 recipient set is deduplicated and always excludes initiating user", async () => {
    const db = fakeWriter([
      { userId: sourceUser }, { userId: memberUser }, { userId: memberUser },
    ]);
    await notifyActiveProjectMembers(db.tx, eventId, {
      ...notice, roles: ["LEARNER"],
    });
    expect(deliverInAppNotificationInTransaction).toHaveBeenCalledWith(
      db.tx, eventId, [memberUser],
      { title: notice.title, body: notice.body, actionHref: notice.actionHref },
    );
    expect(db.conditions).toHaveLength(1);
    const statement = new PgDialect().sqlToQuery(db.conditions[0] as never);
    expect(statement.params).toContain(projectId);
    expect(statement.params).toContain(collegeId);
    expect(statement.params).toContain("LEARNER");
    expect(statement.params).toContain("ACTIVE");
    expect(statement.sql).toContain("ended_at");
    expect(statement.sql).toContain("college_id");
  });

  it("PROJ-BREAK-NOTIFY-04 removed project membership can receive only own scoped removal notice", async () => {
    const db = fakeWriter([
      { userId: sourceUser }, { userId: memberUser }, { userId: memberUser },
    ]);
    await notifyProjectMemberships(db.tx, eventId, {
      ...notice, membershipIds: [
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ],
    });
    expect(deliverInAppNotificationInTransaction).toHaveBeenCalledWith(
      db.tx, eventId, [memberUser], expect.objectContaining({ title: "Project updated" }),
    );
    const statement = new PgDialect().sqlToQuery(db.conditions[0] as never);
    expect(statement.params).toContain(collegeId);
    expect(statement.params).toContain("ACTIVE");
    expect(statement.sql).toContain("college_id");
  });

  it("PROJ-BREAK-NOTIFY-05 absent removal recipients never touch DB or notifications", async () => {
    const db = fakeWriter([{ userId: memberUser }]);
    expect(await notifyProjectMemberships(db.tx, eventId, {
      ...notice, membershipIds: [],
    })).toEqual({ delivered: 0 });
    expect(db.select).not.toHaveBeenCalled();
    expect(deliverInAppNotificationInTransaction).not.toHaveBeenCalled();
  });
});
