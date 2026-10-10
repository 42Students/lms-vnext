import { describe, expect, it } from "vitest";
import {
  acceptRecruiterInvite,
  previewRecruiterInvite,
  type InviteAcceptanceRecord,
  type InviteAcceptanceStore,
} from "@/modules/placements/tpo-recruiter-invite-acceptance";
import { createRecruiterInviteCredential } from "@/modules/placements/tpo-recruiter-invite-policy";

const now = new Date("2026-10-10T06:30:00.000Z");
const base = {
  inviteTokenHash: null, inviteSentAt: null, unsubscribedAt: null,
  manualStage: "NEW", recruiterUserId: null,
};
function fixture() {
  const credential = createRecruiterInviteCredential(base, now);
  let record: InviteAcceptanceRecord | null = {
    ...base, id: "lead-1", collegeId: "college-1",
    companyRelationshipId: "company-1",
    inviteTokenHash: credential.hash, inviteSentAt: now,
  };
  let grants = 0;
  const store: InviteAcceptanceStore = {
    async findByTokenHash(hash) {
      return record?.inviteTokenHash === hash ? { ...record } : null;
    },
    async consumeAndGrant(args) {
      if (!record || record.id !== args.leadId ||
          record.collegeId !== args.collegeId ||
          record.inviteTokenHash !== args.expectedTokenHash ||
          record.recruiterUserId) return false;
      record = { ...record, inviteTokenHash: null, recruiterUserId: args.recruiterUserId };
      grants++;
      return true;
    },
  };
  return { credential, store, grants: () => grants };
}
describe("W05 recruiter invitation acceptance contract (mock transactional adapter)", () => {
  it("preview is read-only and does not consume the invitation", async () => {
    const f = fixture();
    expect(await previewRecruiterInvite(f.store, f.credential.token, now))
      .toEqual({ valid: true, collegeId: "college-1" });
    expect(await previewRecruiterInvite(f.store, f.credential.token, now))
      .toEqual({ valid: true, collegeId: "college-1" });
    expect(f.grants()).toBe(0);
  });
  it("accepts exactly once and prevents replay", async () => {
    const f = fixture();
    await acceptRecruiterInvite(f.store, {
      token: f.credential.token, recruiterUserId: "recruiter-1",
    }, now);
    expect(f.grants()).toBe(1);
    await expect(acceptRecruiterInvite(f.store, {
      token: f.credential.token, recruiterUserId: "recruiter-2",
    }, now)).rejects.toThrow("INVITE_INVALID");
    expect(f.grants()).toBe(1);
  });
  it("only one concurrent consumer wins when store uses CAS", async () => {
    const f = fixture();
    const results = await Promise.allSettled([
      acceptRecruiterInvite(f.store, { token: f.credential.token, recruiterUserId: "r1" }, now),
      acceptRecruiterInvite(f.store, { token: f.credential.token, recruiterUserId: "r2" }, now),
    ]);
    expect(results.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(x => x.status === "rejected")).toHaveLength(1);
    expect(f.grants()).toBe(1);
  });
  it("rejects malformed input without querying storage", async () => {
    let queried = false;
    const store: InviteAcceptanceStore = {
      async findByTokenHash() { queried = true; return null; },
      async consumeAndGrant() { throw Error("must not be called"); },
    };
    await expect(acceptRecruiterInvite(store, {
      token: "not-a-token", recruiterUserId: "r1",
    }, now)).rejects.toThrow("INVITE_INVALID");
    expect(queried).toBe(false);
  });
});
