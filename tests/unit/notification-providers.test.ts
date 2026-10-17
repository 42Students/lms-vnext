import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createExotelSmsProvider,
  readExotelConfig,
} from "@/modules/notifications/exotel-sms";
import {
  createZeptoMailEmailProvider,
  readZeptoMailConfig,
} from "@/modules/notifications/zeptomail-email";

const exotel = readExotelConfig({
  EXOTEL_API_KEY: "key-123",
  EXOTEL_API_TOKEN: "token-456",
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Exotel SMS provider", () => {
  it("posts the DLT form to the account's JSON endpoint with basic auth", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ SMSMessage: { Sid: "sid-1", Status: "queued" } }),
    );
    const accepted = await createExotelSmsProvider(
      exotel,
      fetchMock as unknown as typeof fetch,
    ).sendOtp("+919100060001", "123456");

    expect(accepted).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://api.exotel.com/v1/Accounts/42students1/Sms/send.json",
    );
    expect(
      new Headers(init.headers).get("Authorization"),
    ).toBe(`Basic ${Buffer.from("key-123:token-456").toString("base64")}`);
    const form = new URLSearchParams(init.body as URLSearchParams);
    expect(form.get("To")).toBe("+919100060001");
    expect(form.get("Body")).toMatch(/^123456 is the One Time Password/);
    expect(form.get("DltEntityId")).toBeTruthy();
    expect(form.get("DltTemplateId")).toBeTruthy();
    expect(form.get("SmsType")).toBe("transactional_opt_in");
  });

  it("fails closed without credentials, with a bad number or a bad code", async () => {
    const fetchMock = vi.fn();
    const noCreds = createExotelSmsProvider(
      readExotelConfig({}),
      fetchMock as unknown as typeof fetch,
    );
    expect(await noCreds.sendOtp("+919100060001", "123456")).toBe(false);

    const provider = createExotelSmsProvider(
      exotel,
      fetchMock as unknown as typeof fetch,
    );
    expect(await provider.sendOtp("9100060001", "123456")).toBe(false);
    expect(await provider.sendOtp("+919100060001", "12ab56")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats provider failure statuses and network errors as not accepted", async () => {
    const failed = createExotelSmsProvider(
      exotel,
      (async () =>
        jsonResponse({
          SMSMessage: { Sid: "x", Status: "failed-dnd" },
        })) as unknown as typeof fetch,
    );
    expect(await failed.sendOtp("+919100060001", "123456")).toBe(false);

    const http500 = createExotelSmsProvider(
      exotel,
      (async () => jsonResponse({}, 500)) as unknown as typeof fetch,
    );
    expect(await http500.sendOtp("+919100060001", "123456")).toBe(false);

    const down = createExotelSmsProvider(exotel, (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch);
    expect(await down.sendOtp("+919100060001", "123456")).toBe(false);
  });

  it("never writes the phone number, code or credentials to logs", async () => {
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const ok = createExotelSmsProvider(
      exotel,
      (async () =>
        jsonResponse({
          SMSMessage: { Sid: "s", Status: "queued" },
        })) as unknown as typeof fetch,
    );
    await ok.sendOtp("+919100060001", "654321");
    const bad = createExotelSmsProvider(exotel, (async () => {
      throw new Error("boom +919100060001 654321 key-123");
    }) as unknown as typeof fetch);
    await bad.sendOtp("+919100060001", "654321");

    const logged = [...out.mock.calls, ...err.mock.calls]
      .map((call) => String(call[0]))
      .join("");
    expect(logged).not.toContain("919100060001");
    expect(logged).not.toContain("654321");
    expect(logged).not.toContain("key-123");
    expect(logged).not.toContain("token-456");
  });
});

describe("ZeptoMail provider", () => {
  const zepto = readZeptoMailConfig({ ZEPTOMAIL_TOKEN: '"Zoho-enczapikey abc"' });

  it("sends the OTP template with the legacy merge fields", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
    const accepted = await createZeptoMailEmailProvider(
      zepto,
      fetchMock as unknown as typeof fetch,
    ).sendOtpEmail({
      toEmail: "learner@example.test",
      displayName: "Test Learner",
      code: "123456",
      phoneE164: "+919100060001",
    });

    expect(accepted).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.zeptomail.in/v1.1/email/template");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Zoho-enczapikey abc",
    );
    const body = JSON.parse(init.body as string);
    expect(body.from.address).toBe("hello@42lms.com");
    expect(body.to[0].email_address.address).toBe("learner@example.test");
    expect(body.merge_info).toEqual({
      otp: "123456",
      learnerName: "Test Learner",
      email: "learner@example.test",
      mobile: "+919100060001",
      expiryMinutes: "5",
    });
  });

  it("fails closed without a token and on provider errors", async () => {
    const fetchMock = vi.fn();
    expect(
      await createZeptoMailEmailProvider(
        readZeptoMailConfig({}),
        fetchMock as unknown as typeof fetch,
      ).sendOtpEmail({
        toEmail: "a@b.test",
        displayName: "A",
        code: "123456",
      }),
    ).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    expect(
      await createZeptoMailEmailProvider(
        zepto,
        (async () => jsonResponse({}, 401)) as unknown as typeof fetch,
      ).sendOtpEmail({
        toEmail: "a@b.test",
        displayName: "A",
        code: "123456",
      }),
    ).toBe(false);
  });
});
