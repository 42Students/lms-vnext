import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoMessagesInbox } from "@/modules/placements/tpo-messages-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO messages tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("TPO messages against PostgreSQL", () => {
  it("reads the available source without error", async () => {
    const result = await getTpoMessagesInbox(tpo, {});
    expect(["RECRUITER_THREADS", "PLACEMENT_NOTIFICATIONS"]).toContain(result.source);
    expect(result.summary.total).toBeGreaterThanOrEqual(0);
    expect(result.disclosure.messageBodiesExposed).toBe(false);
  });

  it("applies filters", async () => {
    const result = await getTpoMessagesInbox(tpo, {
      status: "UNREAD",
      from: "2020-01-01",
      to: "2040-01-01",
      q: "a",
    });
    expect(result.page).toBe(1);
  });

  it("rejects a non-TPO membership", async () => {
    await expect(
      getTpoMessagesInbox(
        { ...tpo, membership: { ...tpo.membership!, roles: ["COLLEGE_ADMIN"] } },
        {},
      ),
    ).rejects.toBeDefined();
  });
});
