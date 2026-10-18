import { beforeEach, describe, expect, it, vi } from "vitest";
import { outboundFetch } from "@/lib/outbound";
import { writeStructuredLog } from "@/observability/logger";
import { createExotelSmsProvider, type ExotelConfig } from "@/modules/notifications/exotel-sms";
import { createZeptoMailEmailProvider, isSecureMailProviderEndpoint, type ZeptoMailConfig } from "@/modules/notifications/zeptomail-email";

vi.mock("@/lib/outbound", () => ({ outboundFetch: vi.fn() }));
vi.mock("@/observability/logger", () => ({ writeStructuredLog: vi.fn() }));

const smsConfig: ExotelConfig = {
  apiKey: "test-key", apiToken: "test-token", accountSid: "test-account",
  dltEntityId: "123456789", otpSenderId: "DLTSND",
  otpDltTemplateId: "123456789012", smsType: "transactional_opt_in",
};
const emailConfig: ZeptoMailConfig = {
  apiUrl: "https://api.zeptomail.in/v1.1/email/template",
  token: "test-token", otpTemplateKey: "otp-template",
  fromAddress: "login@example.org", fromName: "42LMS",
};
const sms = createExotelSmsProvider(smsConfig);
const otpEmail = createZeptoMailEmailProvider(emailConfig);
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
const sendSms = (code = "123456") => sms.sendOtp("+919876543210", code);
const sendEmail = (toEmail: string) =>
  otpEmail.sendOtpEmail({ toEmail, displayName: "Learner", code: "123456" });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("chat-16 OTP channel acceptance, validation and graceful failure", () => {
  it("AUTH-OTP-DELIVERY-01 requires an affirmative Exotel state and valid SID, not HTTP 200", async () => {
    for (const status of ["rejected", "failed", "undelivered", "pending", "unknown"]) {
      vi.mocked(outboundFetch).mockResolvedValueOnce(response({
        SMSMessage: { Sid: "SM-42", Status: status },
      }));
      expect(await sendSms()).toBe(false);
    }
    vi.mocked(outboundFetch).mockResolvedValueOnce(response({
      SMSMessage: { Sid: "SM\n-42", Status: "sent" },
    }));
    expect(await sendSms()).toBe(false);
    vi.mocked(outboundFetch).mockResolvedValueOnce(response({
      SMSMessage: { Sid: "SM-42", Status: "queued" },
    }));
    expect(await sendSms()).toBe(true);
    expect(outboundFetch).toHaveBeenCalledTimes(7);
  });

  it("AUTH-OTP-DELIVERY-01 rejects malformed codes and phones without sending", async () => {
    expect(await sendSms("12ab56")).toBe(false);
    expect(await sms.sendOtp("9876543210", "123456")).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("AUTH-OTP-DELIVERY-01 catches provider outages without exposing OTP or recipient in logs", async () => {
    vi.mocked(outboundFetch).mockRejectedValueOnce(new Error("private-provider-secret"));
    expect(await sendSms()).toBe(false);
    const logs = JSON.stringify(vi.mocked(writeStructuredLog).mock.calls);
    expect(logs).not.toContain("private-provider-secret");
    expect(logs).not.toContain("9876543210");
    expect(logs).not.toContain("123456");
  });

  it("AUTH-OTP-DELIVERY-02 rejects spoofed, control-character and malformed email recipients", async () => {
    for (const email of [
      "user@@example.org", "user@example", "user@-bad.example.org",
      "a..b@example.org", "user@example.org\r\nBcc:attacker@example.org",
      "user@example.org\n", "plain-text",
    ]) {
      expect(await sendEmail(email)).toBe(false);
    }
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("AUTH-OTP-DELIVERY-02 rejects whitespace-only auth tokens and failed provider responses", async () => {
    const badToken = createZeptoMailEmailProvider({ ...emailConfig, token: "  " });
    expect(await badToken.sendOtpEmail({
      toEmail: "learner@example.org", displayName: "Learner", code: "123456",
    })).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();

    vi.mocked(outboundFetch).mockResolvedValueOnce(response({ error: "rejected" }, 503));
    expect(await sendEmail("learner@example.org")).toBe(false);
    vi.mocked(outboundFetch).mockRejectedValueOnce(new Error("private-provider-secret"));
    expect(await sendEmail("learner@example.org")).toBe(false);
    expect(outboundFetch).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(vi.mocked(writeStructuredLog).mock.calls)).not.toContain("private-provider-secret");
  });

  it("AUTH-OTP-DELIVERY-02 accepts valid provider acknowledgment with a single POST", async () => {
    vi.mocked(outboundFetch).mockResolvedValueOnce(response({ request_id: "provider-accepted" }));
    expect(await sendEmail("learner@example.org")).toBe(true);
    expect(outboundFetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(outboundFetch).mock.calls[0];
    expect(options).toMatchObject({ method: "POST", maxAttempts: 1 });
    expect(JSON.parse(String(options?.body)).to[0]?.email_address?.address).toBe("learner@example.org");
  });
  it("AUTH-OTP-DELIVERY-03 never posts OTPs to plaintext, credentialed or invalid endpoints", async () => {
    expect(isSecureMailProviderEndpoint("https://api.zeptomail.in/v1.1/email/template")).toBe(true);
    expect(isSecureMailProviderEndpoint("http://localhost:1234/collect")).toBe(false);
    expect(isSecureMailProviderEndpoint("https://username:password@api.zeptomail.in/private")).toBe(false);
    expect(isSecureMailProviderEndpoint("not-a-url")).toBe(false);
    for (const apiUrl of [
      "http://localhost:1234/collect",
      "https://username:password@api.zeptomail.in/private",
      "not-a-url",
    ]) {
      const provider = createZeptoMailEmailProvider({ ...emailConfig, apiUrl });
      expect(await provider.sendOtpEmail({
        toEmail: "learner@example.org", code: "123456", displayName: "Learner",
      })).toBe(false);
    }
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("AUTH-OTP-EXOTEL-04 rejects whitespace-only credentials and sender registration without an outbound POST", async () => {
    for (const change of [
      { apiKey: " " }, { apiToken: "\t " },
      { dltEntityId: "  " }, { otpSenderId: "\n" }, { otpDltTemplateId: " " },
    ]) {
      const provider = createExotelSmsProvider({ ...smsConfig, ...change });
      expect(await provider.sendOtp("+919876543210", "123456")).toBe(false);
    }
    expect(outboundFetch).not.toHaveBeenCalled();
  });

  it("AUTH-OTP-ZEPTO-05 never sends email with blank configured OTP template", async () => {
    const provider = createZeptoMailEmailProvider({
      ...emailConfig, otpTemplateKey: " \t ",
    });
    expect(await provider.sendOtpEmail({
      toEmail: "learner@example.org", displayName: "Learner", code: "123456",
    })).toBe(false);
    expect(outboundFetch).not.toHaveBeenCalled();
  });

});
