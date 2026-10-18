import { describe, expect, it, vi } from "vitest";
import {
  createZeptoMailEmailProvider,
  isSecureMailProviderEndpoint,
  readZeptoMailConfig,
  type ZeptoMailConfig,
} from "@/modules/notifications/zeptomail-email";
import {
  createExotelSmsProvider,
  readExotelConfig,
  type ExotelConfig,
} from "@/modules/notifications/exotel-sms";

const emailConfig: ZeptoMailConfig = {
  apiUrl: "https://api.zeptomail.in/v1.1/email/template",
  token: "fake-test-token",
  otpTemplateKey: "otp.template",
  fromAddress: "no-reply@example.org",
  fromName: "Example",
};
const smsConfig: ExotelConfig = {
  apiKey: "fake-key",
  apiToken: "fake-token",
  accountSid: "example-account",
  dltEntityId: "12345",
  otpSenderId: "TESTOTP",
  otpDltTemplateId: "registered-template",
  smsType: "transactional_opt_in",
};

const otp = {
  toEmail: "Alice@Example.org",
  displayName: "Alice",
  code: "123456",
  phoneE164: "+919876543210",
};

describe("chat-16 OTP notification provider boundaries (isolated transport)", () => {
  it("notification-zepto-config-16 strips env token wrapper and rejects insecure endpoints", () => {
    const config = readZeptoMailConfig({ ZEPTOMAIL_TOKEN: '  "local-token"  ' });
    expect(config.token).toBe("local-token");
    expect(config.apiUrl).toBe("https://api.zeptomail.in/v1.1/email/template");
    expect(isSecureMailProviderEndpoint(config.apiUrl)).toBe(true);
    for (const url of [
      "http://api.zeptomail.in/v1.1/email/template",
      "https://user:secret@api.zeptomail.in/v1.1/email/template",
      "not a URL",
    ]) {
      expect(isSecureMailProviderEndpoint(url)).toBe(false);
    }
  });

  it("notification-zepto-denials-16 makes no provider request for absent token, insecure URL, malformed recipient or code", async () => {
    const transport = vi.fn(async () => new Response("", { status: 202 }));
    const variants = [
      { config: { ...emailConfig, token: "" }, message: otp },
      { config: { ...emailConfig, apiUrl: "http://localhost/send" }, message: otp },
      { config: emailConfig, message: { ...otp, toEmail: "foo@@example.org" } },
      { config: emailConfig, message: { ...otp, code: "123\n456" } },
    ];
    for (const variant of variants) {
      await expect(createZeptoMailEmailProvider(
        variant.config, transport as unknown as typeof fetch,
      ).sendOtpEmail(variant.message)).resolves.toBe(false);
    }
    expect(transport).not.toHaveBeenCalled();
  });

  it("notification-zepto-canonical-recipient-16 sends the same normalized address in envelope and merge fields", async () => {
    const transport = vi.fn(async () => new Response("", { status: 202 }));
    const provider = createZeptoMailEmailProvider(emailConfig, transport as unknown as typeof fetch);
    await expect(provider.sendOtpEmail({
      ...otp, toEmail: "  ALICE@Example.ORG  ",
    })).resolves.toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, request] = transport.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(emailConfig.apiUrl);
    expect(request.method).toBe("POST");
    const body = JSON.parse(String(request.body)) as {
      template_key: string;
      merge_info: { email: string; otp: string; expiryMinutes: string };
      to: Array<{ email_address: { address: string; name: string } }>;
    };
    expect(body.template_key).toBe(emailConfig.otpTemplateKey);
    expect(body.to[0]?.email_address).toEqual({
      address: "alice@example.org", name: "alice@example.org",
    });
    expect(body.merge_info).toMatchObject({
      email: "alice@example.org", otp: otp.code, expiryMinutes: "5",
    });
  });

  it("notification-zepto-upstream-16 does not report HTTP 429 or ambiguous transport failure as accepted", async () => {
    const transport = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockRejectedValueOnce(new Error("provider failure includes private data"));
    const provider = createZeptoMailEmailProvider(emailConfig, transport as unknown as typeof fetch);
    await expect(provider.sendOtpEmail(otp)).resolves.toBe(false);
    await expect(provider.sendOtpEmail(otp)).resolves.toBe(false);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("notification-exotel-config-16 loads registered DLT parameters from the provided environment", () => {
    const read = readExotelConfig({
      EXOTEL_API_KEY: "key", EXOTEL_API_TOKEN: "token",
      EXOTEL_ACCOUNT_SID: "tenant", EXOTEL_DLT_ENTITY_ID: "entity",
      EXOTEL_OTP_SENDER_ID: "SENDID", EXOTEL_OTP_DLT_TEMPLATE_ID: "otp-dlt",
      EXOTEL_OTP_SMS_TYPE: "transactional_opt_in",
    });
    expect(read).toMatchObject({
      apiKey: "key", accountSid: "tenant", dltEntityId: "entity",
      otpSenderId: "SENDID", otpDltTemplateId: "otp-dlt",
    });
  });

  it("notification-exotel-denials-16 fails closed on invalid code, phone, missing DLT or unsafe account path", async () => {
    const transport = vi.fn(async () => new Response("{}", { status: 200 }));
    const cases: Array<{ config: ExotelConfig; phone: string; code: string }> = [
      { config: smsConfig, phone: "+919876543210", code: "12ab" },
      { config: smsConfig, phone: "9876543210", code: "123456" },
      { config: { ...smsConfig, dltEntityId: "" }, phone: "+919876543210", code: "123456" },
      { config: { ...smsConfig, accountSid: "../unsafe" }, phone: "+919876543210", code: "123456" },
    ];
    for (const value of cases) {
      await expect(createExotelSmsProvider(
        value.config, transport as unknown as typeof fetch,
      ).sendOtp(value.phone, value.code)).resolves.toBe(false);
    }
    expect(transport).not.toHaveBeenCalled();
  });

  it("notification-exotel-request-16 emits registered DLT fields and reports acceptance only with a SID", async () => {
    const transport = vi.fn(async () => new Response(JSON.stringify({
      SMSMessage: { Sid: "SM-123", Status: "queued" },
    }), { status: 200 }));
    await expect(createExotelSmsProvider(
      smsConfig, transport as unknown as typeof fetch,
    ).sendOtp("+919876543210", "123456")).resolves.toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, request] = transport.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.exotel.com/v1/Accounts/example-account/Sms/send.json");
    expect(request.method).toBe("POST");
    expect(request.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const fields = request.body as URLSearchParams;
    expect(fields.get("DltEntityId")).toBe(smsConfig.dltEntityId);
    expect(fields.get("DltTemplateId")).toBe(smsConfig.otpDltTemplateId);
    expect(fields.get("To")).toBe("+919876543210");
    expect(fields.get("Body")).toContain("123456 is the One Time Password");
  });

  it("notification-exotel-rejections-16 rejects negative provider statuses, missing SID, malformed JSON and timeout", async () => {
    const transport = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        SMSMessage: { Sid: "SM-12", Status: "rejected" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        SMSMessage: { Status: "queued" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 }))
      .mockRejectedValueOnce(new Error("timeout"));
    const provider = createExotelSmsProvider(smsConfig, transport as unknown as typeof fetch);
    for (let index = 0; index < 4; index += 1) {
      await expect(provider.sendOtp("+919876543210", "123456")).resolves.toBe(false);
    }
    expect(transport).toHaveBeenCalledTimes(4);
  });
});
