import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection,getDb } from "@/db/client";
import { users,collegeMemberships,membershipRoles } from "@/db/schema";
import { and,eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getTpoMessagesInbox } from "@/modules/placements/tpo-messages-service";
import { countTpoUnreadRecruiterMessages } from "@/modules/placements/tpo-recruiter-unread-count-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO messages tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
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

  it("rejects forged or revoked TPO session claims before reading private inbox or unread counts", async () => {
    // The shared seed admin may receive a persisted TPO role in an unrelated
    // concurrent test. Use a private principal so this remains a real negative
    // privilege witness rather than depending on mutable global seed roles.
    const userId=randomUUID(),membershipId=randomUUID();
    const identityUid="tpo-inbox-negative-"+userId;
    const db=getDb();
    await db.insert(users).values({
      id:userId,identityUid,displayName:"Private inbox guard test",platformStatus:"ACTIVE",
    });
    try {
      await db.insert(collegeMemberships).values({
        id:membershipId,userId,collegeId:SEED_IDS.collegeA,status:"ACTIVE",
      });
      await db.insert(membershipRoles).values({membershipId,role:"COLLEGE_ADMIN"});
      const claimed:RequestContext={
        ...tpo,
        user:{...tpo.user,id:userId,identityUid},
        membership:{...tpo.membership!,id:membershipId,roles:["TPO"]},
      };
      // An active COLLEGE_ADMIN membership with an invented TPO claim does not
      // authorize either private inbox. These are persisted-role checks.
      await expect(getTpoMessagesInbox(claimed,{})).rejects.toThrow(
        "Missing permission: placements.manage",
      );
      await expect(countTpoUnreadRecruiterMessages(claimed)).rejects.toThrow(
        "Missing permission: placements.manage",
      );
      await db.insert(membershipRoles).values({membershipId,role:"TPO"});
      // Verify the live role authorizes this exact actor before revoking it:
      // otherwise a trivially failing negative would not test revocation.
      await expect(getTpoMessagesInbox(claimed,{})).resolves.toHaveProperty(
        "collegeId",SEED_IDS.collegeA,
      );
      const wrongUser:RequestContext={
        ...claimed,user:{...claimed.user,id:SEED_IDS.collegeAdminUser},
      };
      await expect(getTpoMessagesInbox(wrongUser,{})).rejects.toThrow(
        "Missing permission: placements.manage",
      );
      const wrongCollege:RequestContext={
        ...claimed,membership:{...claimed.membership!,collegeId:SEED_IDS.collegeB},
      };
      await expect(countTpoUnreadRecruiterMessages(wrongCollege)).rejects.toThrow(
        "Missing permission: placements.manage",
      );
      // Revoking just this fixture's TPO role must immediately deny a stale
      // authorized-session claim without disturbing other concurrent tests.
      await db.delete(membershipRoles).where(and(
        eq(membershipRoles.membershipId,membershipId),
        eq(membershipRoles.role,"TPO"),
      ));
      await expect(getTpoMessagesInbox(claimed,{})).rejects.toThrow(
        "Missing permission: placements.manage",
      );
      await expect(countTpoUnreadRecruiterMessages(claimed)).rejects.toThrow(
        "Missing permission: placements.manage",
      );
    } finally {
      await db.delete(membershipRoles).where(eq(membershipRoles.membershipId,membershipId));
      await db.delete(collegeMemberships).where(eq(collegeMemberships.id,membershipId));
      await db.delete(users).where(eq(users.id,userId));
    }
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
