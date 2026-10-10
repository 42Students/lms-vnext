import { describe, expect, it } from "vitest";
import {
  RECRUITER_INVITE_TTL_MS,
  RecruiterInviteError,
  canIssueRecruiterInvite,
  canRemindRecruiterInvite,
  createRecruiterInviteCredential,
  isRecruiterInviteUsable,
  requireRecruiterInviteUsable,
  type RecruiterInviteLeadState,
} from "@/modules/placements/tpo-recruiter-invite-policy";

const start = new Date("2026-10-10T06:30:00.000Z");
const base: RecruiterInviteLeadState = {
  inviteTokenHash: null,
  inviteSentAt: null,
  unsubscribedAt: null,
  manualStage: "NEW",
  recruiterUserId: null,
};

describe("W05 recruiter invite token and privacy policy", () => {
  it("generates unique 32-byte tokens, stores only SHA-256 and keeps exact 7-day TTL", () => {
    const one = createRecruiterInviteCredential(base, start);
    const two = createRecruiterInviteCredential(base, start);
    expect(one.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(one.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(one.hash).not.toContain(one.token);
    expect(one.token).not.toBe(two.token);
    expect(one.hash).not.toBe(two.hash);
    expect(one.expiresAt.getTime() - one.issuedAt.getTime())
      .toBe(RECRUITER_INVITE_TTL_MS);
  });

  it("previews are repeatable, and rotation revokes the previous token", () => {
    const first = createRecruiterInviteCredential(base, start);
    const stored = { ...base, inviteTokenHash: first.hash, inviteSentAt: start };
    const t = new Date(start.getTime() + 1000);
    expect(isRecruiterInviteUsable(first.token, stored, t)).toBe(true);
    expect(isRecruiterInviteUsable(first.token, stored, t)).toBe(true);
    const replacement = createRecruiterInviteCredential(stored, t);
    expect(isRecruiterInviteUsable(first.token, {
      ...stored, inviteTokenHash: replacement.hash, inviteSentAt: t,
    }, t)).toBe(false);
    expect(isRecruiterInviteUsable(replacement.token, {
      ...stored, inviteTokenHash: replacement.hash, inviteSentAt: t,
    }, t)).toBe(true);
  });

  it("expires at exactly day 7, fails closed for future-issued or invalid-date token", () => {
    const c = createRecruiterInviteCredential(base, start);
    const stored = { ...base, inviteTokenHash: c.hash, inviteSentAt: start };
    expect(isRecruiterInviteUsable(
      c.token, stored, new Date(start.getTime() + RECRUITER_INVITE_TTL_MS - 1),
    )).toBe(true);
    expect(isRecruiterInviteUsable(
      c.token, stored, new Date(start.getTime() + RECRUITER_INVITE_TTL_MS),
    )).toBe(false);
    expect(isRecruiterInviteUsable(
      c.token, stored, new Date(start.getTime() - 1),
    )).toBe(false);
    expect(isRecruiterInviteUsable(c.token, stored, new Date(NaN))).toBe(false);
    expect(isRecruiterInviteUsable(c.token, { ...stored, inviteSentAt: new Date(NaN) }, start)).toBe(false);
  });

  it("rejects joined, unsubscribed and Not Now state before issuing or previewing", () => {
    const credential = createRecruiterInviteCredential(base, start);
    const live = { ...base, inviteTokenHash: credential.hash, inviteSentAt: start };
    for (const blocked of [
      { ...live, recruiterUserId: "recruiter-joined" },
      { ...live, unsubscribedAt: new Date(start) },
      { ...live, manualStage: "NOT_NOW" },
    ]) {
      expect(canIssueRecruiterInvite(blocked)).toBe(false);
      expect(isRecruiterInviteUsable(
        credential.token, blocked, new Date(start.getTime() + 100),
      )).toBe(false);
      expect(() => createRecruiterInviteCredential(blocked, start))
        .toThrow(RecruiterInviteError);
    }
  });

  it("returns one indistinguishable INVALID error for malformed, wrong or missing tokens", () => {
    const c = createRecruiterInviteCredential(base, start);
    const stored = { ...base, inviteTokenHash: c.hash, inviteSentAt: start };
    for (const token of [
      null, undefined, "", "a".repeat(43), "a".repeat(42),
      "//redirect", "javascript:alert(1)", "✅",
    ]) {
      expect(isRecruiterInviteUsable(token, stored, start)).toBe(false);
      expect(() => requireRecruiterInviteUsable(token, stored, start))
        .toThrowError("INVITE_INVALID");
    }
    expect(() => requireRecruiterInviteUsable(c.token, null, start))
      .toThrowError("INVITE_INVALID");
    expect(() => requireRecruiterInviteUsable(c.token, {
      ...stored, inviteTokenHash: "0".repeat(64),
    }, start)).toThrowError("INVITE_INVALID");
  });

  it("permits one eligible day-four reminder and blocks contact/click/expiry", () => {
    const c = createRecruiterInviteCredential(base, start);
    const state = {
      ...base, inviteTokenHash: c.hash, inviteSentAt: start,
      inviteClickedAt: null, inviteReminderSentAt: null,
      emailNorm: "recruiter@example.org",
    };
    const d4 = new Date(start.getTime() + 4 * 24 * 60 * 60 * 1000);
    expect(canRemindRecruiterInvite(state, false, d4)).toBe(true);
    expect(canRemindRecruiterInvite(state, true, d4)).toBe(false);
    expect(canRemindRecruiterInvite({
      ...state, inviteClickedAt: d4,
    }, false, d4)).toBe(false);
    expect(canRemindRecruiterInvite({
      ...state, inviteReminderSentAt: d4,
    }, false, d4)).toBe(false);
    expect(canRemindRecruiterInvite({
      ...state, emailNorm: null,
    }, false, d4)).toBe(false);
    expect(canRemindRecruiterInvite(
      state, false, new Date(start.getTime() + RECRUITER_INVITE_TTL_MS),
    )).toBe(false);
    expect(canRemindRecruiterInvite(state, false,
      new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000),
    )).toBe(false);
  });
});
