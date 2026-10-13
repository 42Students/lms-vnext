import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveTpoNotificationPreferences,
  safeTpoNotificationLabel,
  tpoMyNotificationsHref,
  tpoMyNotificationsQuerySchema,
  tpoNotificationReadStatus,
  TPO_NOTIFICATION_PREFERENCE_DEFAULTS,
  TPO_NOTIFICATION_PREFERENCE_FIELDS,
} from "@/modules/placements/tpo-my-notifications-model";

describe("TPO My Notifications read model", () => {
  it("uses only fixed safe module labels", () => {
    expect(
      safeTpoNotificationLabel("PLACEMENTS"),
    ).toBe("Placement update");

    expect(
      safeTpoNotificationLabel("COURSES"),
    ).toBe("Course update");

    expect(
      safeTpoNotificationLabel("PROJECTS"),
    ).toBe("Project update");

    expect(
      safeTpoNotificationLabel(
        "person@example.com",
      ),
    ).toBe("College notification");

    expect(
      safeTpoNotificationLabel(
        "HIGHLY_PRIVATE_STUDENT_DETAILS",
      ),
    ).toBe("College notification");
  });

  it("derives read status only from persisted readAt", () => {
    expect(
      tpoNotificationReadStatus(null),
    ).toBe("UNREAD");

    expect(
      tpoNotificationReadStatus(
        new Date("2026-10-14T06:00:00.000Z"),
      ),
    ).toBe("READ");
  });

  it("reports an unavailable preference table without inventing values", () => {
    expect(
      resolveTpoNotificationPreferences(
        false,
        null,
      ),
    ).toEqual({
      source: "UNAVAILABLE",
      values: null,
    });
  });

  it("separates database source defaults from a saved preference row", () => {
    const defaults =
      resolveTpoNotificationPreferences(
        true,
        null,
      );

    expect(defaults).toEqual({
      source: "SOURCE_DEFAULT",
      values: {
        morningDigest: false,
        recruiterMessages: true,
        requests: true,
        resultsReady: true,
        followUps: true,
      },
    });

    const persisted =
      resolveTpoNotificationPreferences(
        true,
        {
          morningDigest: true,
          recruiterMessages: false,
          requests: false,
          resultsReady: true,
          followUps: false,
        },
      );

    expect(persisted).toEqual({
      source: "PERSISTED",
      values: {
        morningDigest: true,
        recruiterMessages: false,
        requests: false,
        resultsReady: true,
        followUps: false,
      },
    });

    expect(
      TPO_NOTIFICATION_PREFERENCE_DEFAULTS.morningDigest,
    ).toBe(false);
  });

  it("has one descriptor for each stored preference", () => {
    expect(
      TPO_NOTIFICATION_PREFERENCE_FIELDS.map(
        (field) => field.key,
      ),
    ).toEqual([
      "morningDigest",
      "recruiterMessages",
      "requests",
      "resultsReady",
      "followUps",
    ]);
  });

  it("accepts bounded view and pagination filters", () => {
    expect(
      tpoMyNotificationsQuerySchema.parse({}),
    ).toEqual({
      view: "ALL",
      page: 1,
      pageSize: 25,
    });

    expect(
      tpoMyNotificationsQuerySchema.parse({
        view: "READ",
        page: "2",
        pageSize: "50",
      }),
    ).toEqual({
      view: "READ",
      page: 2,
      pageSize: 50,
    });

    expect(
      tpoMyNotificationsQuerySchema.safeParse({
        view: "UNSEEN",
      }).success,
    ).toBe(false);

    expect(
      tpoMyNotificationsQuerySchema.safeParse({
        page: "-1",
      }).success,
    ).toBe(false);

    expect(
      tpoMyNotificationsQuerySchema.safeParse({
        pageSize: "101",
      }).success,
    ).toBe(false);
  });

  it("does not accept a user or college selector", () => {
    expect(
      tpoMyNotificationsQuerySchema.safeParse({
        userId: "some-user",
      }).success,
    ).toBe(false);

    expect(
      tpoMyNotificationsQuerySchema.safeParse({
        collegeId: "some-college",
      }).success,
    ).toBe(false);
  });

  it("creates pagination URLs without user or tenant identifiers", () => {
    expect(
      tpoMyNotificationsHref({}),
    ).toBe("/tpo/settings/notifications");

    expect(
      tpoMyNotificationsHref({
        view: "UNREAD",
        page: 2,
        pageSize: 50,
      }),
    ).toBe(
      "/tpo/settings/notifications?view=UNREAD&page=2&pageSize=50",
    );
  });
});
