import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outboundFetch } from "@/lib/outbound";
import { createOutboundProvider, readOutboundProviderConfig, type OutboundProviderConfig } from "@/modules/messaging/providers";
import { deliverPublicRecruiterJoinCode } from "@/modules/messaging/public-join-code-delivery";
import { sendRecruiterMessageDigest } from "@/modules/placements/recruiter-message-email-provider";
import type { OutboundSendRequest } from "@/modules/messaging/model";

vi.mock("@/lib/outbound", () => ({ outboundFetch: vi.fn() }));

const templateKey = "campaign.notice";
const config: OutboundProviderConfig = {
  email: {
    apiUrl: "https://api.zeptomail.in/v1.1/email/template",
    token: "valid-token", otpTemplateKey: "otp-auth-template",
    fromAddress: "hello@example.org", fromName: "42LMS",
  },
  sms: {
    apiKey: "test-key", apiToken: "test-token", accountSid: "account-1",
    dltEntityId: "123456", otpSenderId: "OTPSND",
    otpDltTemplateId: "otp-auth-template", smsType: "transactional_opt_in",
  },
  templates: {
    [templateKey]: {
      zeptoTemplateKey: "campaign-recruiter-update",
      exotelDltTemplateId: "registered-campaign-42",
      exotelSenderId: "CAMPSND", renderSms: () => "Registered notice",
    },
  },
};
const email: OutboundSendRequest = {
  channel: "EMAIL", recipient: "recruiter@example.org", templateKey,
  variables: { name: "Recruiter" }, purpose: "campaign",
};
const sms: OutboundSendRequest = {
  ...email, channel: "SMS", recipient: "+919876543210",
};
const providerResponse = (value: unknown) => new Response(JSON.stringify(value), {
  status: 200, headers: { "content-type": "application/json" },
});
const recipient = {
  recipient: "recruiter@example.org", recipientName: "Recruiter",
  companyName: "Company", collegeName: "College",
  replyTo: "r-" + "a".repeat(32) + "@reply.example.org",
  messages: [{ body: "Hello recruiter" }],
};
const bridgeEnv = {
  APP_ENV: "production",
  RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED: "true",
  RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY: "campaign-recruiter-update",
  RECRUITER_MESSAGE_REPLY_DOMAIN: "reply.example.org",
  ZEPTOMAIL_API_URL: "https://api.zeptomail.in/v1.1/email/template",
  ZEPTOMAIL_OTP_TEMPLATE_KEY: "otp-auth-template",
  ZEPTOMAIL_TOKEN: '"  "',
};

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 generic campaign and recruiter email channel fail-closed behavior", () => {
  it("MSG-CHANNEL-FAIL-02 never contacts providers using a whitespace-only credential", async () => {
    const outbound = createOutboundProvider({
      ...config, email: { ...config.email, token: "  " },
    }, fetch, { APP_ENV: "production" });
    expect(await outbound.send(email)).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("MSG-CHANNEL-FAIL-03 denies OTP template reuse and invalid recipients", async () => {
    const outbound = createOutboundProvider(config, fetch, { APP_ENV: "production" });
    expect(await outbound.send({ ...email, templateKey: "login.otp" })).toBe(false);
    expect(await outbound.send({ ...email, recipient: "recruiter@@example.org" })).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("MSG-CHANNEL-FAIL-04 a failed email does not throw, a successful acknowledgement uses a single POST", async () => {
    const outbound = createOutboundProvider(config, fetch, { APP_ENV: "production" });
    vi.mocked(outboundFetch).mockRejectedValueOnce(new Error("private-provider-secret"));
    expect(await outbound.send(email)).toBe(false);
    vi.mocked(outboundFetch).mockResolvedValueOnce(providerResponse({ request_id: "accepted" }));
    expect(await outbound.send(email)).toBe(true);
    expect(outboundFetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(outboundFetch).mock.calls[1]?.[1]).toMatchObject({
      method: "POST", maxAttempts: 1,
    });
  });

  it("MSG-CHANNEL-FAIL-05 SMS requires affirmative provider acceptance, not merely HTTP success", async () => {
    const outbound = createOutboundProvider(config, fetch, { APP_ENV: "production" });
    vi.mocked(outboundFetch).mockResolvedValueOnce(providerResponse({
      SMSMessage: { Sid: "SM-123", Status: "rejected" },
    }));
    expect(await outbound.send(sms)).toBe(false);
    vi.mocked(outboundFetch).mockResolvedValueOnce(providerResponse({
      SMSMessage: { Sid: "SM-123", Status: "submitted" },
    }));
    expect(await outbound.send(sms)).toBe(true);
  });

  it("MSG-CONFIG-01 retains exactly provisioned templates", () => {
    const resolved = readOutboundProviderConfig(config.templates);
    expect(resolved.templates).toBe(config.templates);
    expect(resolved.email.apiUrl).toMatch(/^https:\/\//);
    expect(resolved.sms.accountSid.length).toBeGreaterThan(0);
  });

  it("REC-calendar-messages-profile-R01 refuses quoted whitespace ZeptoMail tokens", async () => {
    expect(await sendRecruiterMessageDigest(recipient, bridgeEnv)).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("REC-join-code-provider-01 refuses quoted whitespace token before network send", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("ZEPTOMAIL_TOKEN", '"  "');
    const transport = vi.fn(async () => new Response(null, { status: 202 }));
    const accepted = await deliverPublicRecruiterJoinCode(
      "recruiter@example.org", "123456", transport as unknown as typeof fetch,
    );
    expect(accepted).toBe(false);
    expect(transport).not.toHaveBeenCalled();
  });
  it("MSG-ENDPOINT-01 never dispatches campaigns to plaintext or credentialed mail hosts", async () => {
    for (const apiUrl of [
      "http://api.zeptomail.in/v1.1/email/template",
      "https://operator:secret@api.zeptomail.in/v1.1/email/template",
      "not-a-url",
    ]) {
      const outbound = createOutboundProvider({
        ...config, email: { ...config.email, apiUrl },
      }, fetch, { APP_ENV: "production" });
      expect(await outbound.send(email)).toBe(false);
    }
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("REC-JOIN-CODE-ENDPOINT-01 rejects insecure join-code API URL before contacting network", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("ZEPTOMAIL_TOKEN", "test-valid-token");
    vi.stubEnv("ZEPTOMAIL_API_URL", "http://127.0.0.1:3000/private");
    const transport = vi.fn(async () => new Response(null, { status: 202 }));
    expect(await deliverPublicRecruiterJoinCode(
      "recruiter@example.org", "123456", transport as unknown as typeof fetch,
    )).toBe(false);
    expect(transport).not.toHaveBeenCalled();
  });

  it("MSG-SMS-PROVIDER-04 refuses whitespace-only Exotel credentials and DLT registration", async () => {
    for (const change of [
      { apiKey: " " }, { apiToken: "  " }, { dltEntityId: "\t " },
    ]) {
      const outbound = createOutboundProvider({
        ...config, sms: { ...config.sms, ...change },
      }, fetch, { APP_ENV: "production" });
      expect(await outbound.send(sms)).toBe(false);
    }
    for (const template of [
      { exotelSenderId: "   " },
      { exotelDltTemplateId: "  " },
    ]) {
      const outbound = createOutboundProvider({
        ...config, templates: { [templateKey]: {
          ...config.templates[templateKey], ...template,
        } },
      }, fetch, { APP_ENV: "production" });
      expect(await outbound.send(sms)).toBe(false);
    }
    expect(outboundFetch).not.toHaveBeenCalled();
  });

});
