import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { recruiterMailBridgeSignature } from "@/modules/placements/recruiter-message-email-model";
import {
  acceptAuthenticatedRecruiterEmailReply,
} from "@/modules/placements/recruiter-message-email-inbound-service";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

const secret = "secure-test-secret".repeat(4);
const env = {
  RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED: "true",
  RECRUITER_MESSAGE_INBOUND_HMAC_SECRET: secret,
  RECRUITER_MESSAGE_REPLY_DOMAIN: "reply.example.org",
};
const body = (overrides: Record<string, unknown> = {}) => JSON.stringify({
  from: "recruiter@example.org",
  to: "r-" + "a".repeat(32) + "@reply.example.org",
  text: "This is my answer.",
  providerMessageId: "provider-message-1234",
  ...overrides,
});
const accepted = (raw: string, signature = recruiterMailBridgeSignature(secret, raw)) =>
  acceptAuthenticatedRecruiterEmailReply(raw, signature, env);

beforeEach(() => vi.resetAllMocks());

describe("chat-16 recruiter inbound email gateway must reject hostile or stale messages", () => {
  it("REC-INBOUND-01 refuses disabled bridge or missing signature before any storage lookup", async () => {
    const raw = body();
    await expect(acceptAuthenticatedRecruiterEmailReply(raw,
      recruiterMailBridgeSignature(secret, raw), {
        ...env, RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED: "false",
      })).resolves.toEqual({ accepted: false, replayed: false });
    await expect(accepted(raw, "wrong")).resolves.toEqual({
      accepted: false, replayed: false,
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("REC-INBOUND-02 authenticates exact body bytes and never accepts appended text", async () => {
    const raw = body();
    const validSignature = recruiterMailBridgeSignature(secret, raw);
    expect(await accepted(raw + " ", validSignature)).toEqual({
      accepted: false, replayed: false,
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("REC-INBOUND-03 rejects replay-looking malformed payloads and forged reply domains", async () => {
    for (const payload of [
      body({ to: "r-" + "a".repeat(32) + "@evil.example.org" }),
      body({ from: "recruiter@@example.org" }),
      body({ providerMessageId: "short" }),
      body({ text: "> quoted private history only" }),
      body({ secret: "injected" }),
      "not-json",
    ]) {
      expect(await accepted(payload)).toEqual({ accepted: false, replayed: false });
    }
    expect(getDb).not.toHaveBeenCalled();
  });

  it("REC-INBOUND-04 refuses provider ingestion while DB migrations are missing", async () => {
    const execute = vi.fn(async () => ({ rows: [{ ok: false }] }));
    const transaction = vi.fn();
    vi.mocked(getDb).mockReturnValue({ execute, transaction } as never);
    expect(await accepted(body())).toEqual({ accepted: false, replayed: false });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(transaction).not.toHaveBeenCalled();
  });
});
