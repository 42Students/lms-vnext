import { beforeEach, describe, expect, it, vi } from "vitest";
import { outboundFetch } from "@/lib/outbound";
import { sendRecruiterMessageDigest } from "@/modules/placements/recruiter-message-email-provider";

vi.mock("@/lib/outbound", () => ({ outboundFetch: vi.fn() }));
const env = {
  APP_ENV: "production",
  RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED: "true",
  RECRUITER_MESSAGE_REPLY_DOMAIN: "reply.example.org",
  RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY: "campaign-recruiter-digest",
  ZEPTOMAIL_TOKEN: "local-only-token",
  ZEPTOMAIL_OTP_TEMPLATE_KEY: "auth-otp",
  ZEPTOMAIL_API_URL: "https://api.zeptomail.in/v1.1/email/template",
};
const payload = {
  recipient: "recruiter@example.org",
  recipientName: "<Recruiter & Co>",
  companyName: "<script>alert(1)</script>",
  collegeName: "College",
  replyTo: "r-" + "f".repeat(32) + "@reply.example.org",
  messages: [
    { body: "one" }, { body: "two" },
    { body: "<script>secret</script>" }, { body: "last" },
  ],
};
beforeEach(() => vi.resetAllMocks());

describe("chat-16 recruiter unread mail bridge fail-closed and privacy behaviors", () => {
  it("REC-MAIL-DIGEST-01 never dispatches when bridge disabled or external recipient unallowlisted", async () => {
    expect(await sendRecruiterMessageDigest(payload, {
      ...env, RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED: "false",
    })).toBe(false);
    expect(await sendRecruiterMessageDigest(payload, {
      ...env, APP_ENV: "staging", AUTH_TEST_EMAILS: "other@example.org",
    })).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("REC-MAIL-DIGEST-02 rejects invalid Reply-To host, OTP template or insecure endpoint", async () => {
    expect(await sendRecruiterMessageDigest({
      ...payload, replyTo: "r-" + "f".repeat(32) + "@evil.example.org",
    }, env)).toBe(false);
    expect(await sendRecruiterMessageDigest(payload, {
      ...env, RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY: env.ZEPTOMAIL_OTP_TEMPLATE_KEY,
    })).toBe(false);
    expect(await sendRecruiterMessageDigest(payload, {
      ...env, ZEPTOMAIL_API_URL: "http://api.zeptomail.in/v1.1/email/template",
    })).toBe(false);
    expect(await sendRecruiterMessageDigest({
      ...payload, messages: [],
    }, env)).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("REC-MAIL-DIGEST-03 escapes HTML controls, caps excerpts to latest three and never retries POST", async () => {
    vi.mocked(outboundFetch).mockResolvedValueOnce(new Response(null, { status: 202 }));
    expect(await sendRecruiterMessageDigest(payload, env)).toBe(true);
    expect(outboundFetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(outboundFetch).mock.calls[0];
    expect(options).toMatchObject({ method: "POST", maxAttempts: 1, timeoutMs: 10000 });
    const json = JSON.parse(String(options?.body)) as {
      merge_info: Record<string, string>;
      reply_to: Array<{ address: string }>;
    };
    expect(json.reply_to[0].address).toBe(payload.replyTo);
    expect(json.merge_info.message1).toBe("two");
    expect(json.merge_info.message2).toBe("&lt;script&gt;secret&lt;/script&gt;");
    expect(json.merge_info.message3).toBe("last");
    expect(json.merge_info.message1).not.toBe("one");
    expect(json.merge_info.company).not.toContain("<script>");
    expect(json.merge_info.name).toContain("&lt;");
  });

  it("REC-MAIL-DIGEST-04 network outage or rejection never reports a successful message notification", async () => {
    vi.mocked(outboundFetch).mockRejectedValueOnce(new Error("private-server-credentials"));
    expect(await sendRecruiterMessageDigest(payload, env)).toBe(false);
    vi.mocked(outboundFetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
    expect(await sendRecruiterMessageDigest(payload, env)).toBe(false);
    expect(outboundFetch).toHaveBeenCalledTimes(2);
  });
});
