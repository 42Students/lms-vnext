import { describe, expect, it } from "vitest";
import {
  parseTpoNotificationReadBody,
  resolveTpoInboxQuery,
  tpoInboxPageHref,
} from "@/modules/activity/tpo-notifications-model";

describe("TPO notifications inbox model", () => {
  it("defaults to the all view and rejects unknown query keys or views", () => {
    expect(resolveTpoInboxQuery({}).query.view).toBe("all");
    expect(resolveTpoInboxQuery({ view: "unread" }).query.view).toBe("unread");
    expect(() => resolveTpoInboxQuery({ view: "read" })).toThrow();
    expect(() => resolveTpoInboxQuery({ collegeId: "forged" })).toThrow();
  });

  it("flags a malformed cursor instead of ignoring it", () => {
    expect(resolveTpoInboxQuery({ beforeId: "x" }).cursor.invalid).toBe(true);
    const at = new Date("2026-10-15T05:00:00.000Z");
    const id = "11111111-1111-4111-8111-111111111111";
    const ok = resolveTpoInboxQuery({ beforeCreatedAt: at.toISOString(), beforeId: id });
    expect(ok.cursor.invalid).toBe(false);
  });

  it("builds an in-portal page link with an ISO cursor", () => {
    const href = tpoInboxPageHref("unread", {
      beforeCreatedAt: new Date("2026-10-15T05:00:00.000Z"),
      beforeId: "11111111-1111-4111-8111-111111111111",
    });
    expect(href.startsWith("/tpo/notifications?view=unread&beforeCreatedAt=")).toBe(true);
  });

  it("accepts only an empty acknowledgement body", () => {
    expect(parseTpoNotificationReadBody("")).toEqual({});
    expect(parseTpoNotificationReadBody("{}")).toEqual({});
    expect(() => parseTpoNotificationReadBody('{"collegeId":"x"}')).toThrow();
    expect(() => parseTpoNotificationReadBody("not json")).toThrow();
  });
});
