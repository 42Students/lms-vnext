import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverPublicRecruiterJoinCode } from "@/modules/messaging/public-join-code-delivery";

beforeEach(() => {
  vi.stubEnv("APP_ENV", "development");
  vi.stubEnv("AUTH_TEST_EMAILS", "allowed@example.org");
  vi.stubEnv("ZEPTOMAIL_TOKEN", "test-placeholder");
  vi.stubEnv("ZEPTOMAIL_API_URL", "https://api.zeptomail.in/v1.1/email/template");
  vi.stubEnv("ZEPTOMAIL_OTP_TEMPLATE_KEY", "auth.otp");
  vi.stubEnv("ZEPTOMAIL_FROM_ADDRESS", "no-reply@example.org");
  vi.stubEnv("ZEPTOMAIL_FROM_NAME", "Example");
});
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 public recruiter join code provider boundary", () => {
  it("REC-JOIN-DELIVERY-16 refuses a valid but non-allowlisted test email before network", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 202 }));
    await expect(deliverPublicRecruiterJoinCode(
      "other@example.org", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("REC-JOIN-DELIVERY-17 rejects malformed recipients, OTP lengths and unavailable credentials", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 202 }));
    await expect(deliverPublicRecruiterJoinCode(
      "invalid@@example.org", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(false);
    for (const code of ["12345", "1234567", "123a56"]) {
      await expect(deliverPublicRecruiterJoinCode(
        "allowed@example.org", code, fetchMock as unknown as typeof fetch,
      )).resolves.toBe(false);
    }
    vi.stubEnv("ZEPTOMAIL_TOKEN", "");
    await expect(deliverPublicRecruiterJoinCode(
      "allowed@example.org", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(false);
    vi.stubEnv("ZEPTOMAIL_TOKEN", "test-placeholder");
    vi.stubEnv("ZEPTOMAIL_API_URL", "http://localhost:8000/unsafe");
    await expect(deliverPublicRecruiterJoinCode(
      "allowed@example.org", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("REC-JOIN-DELIVERY-18 normalizes an allowlisted recipient and rejects HTTP redirects", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 202 }));
    await expect(deliverPublicRecruiterJoinCode(
      "  ALLOWED@Example.ORG  ", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.zeptomail.in/v1.1/email/template");
    expect(init.redirect).toBe("error");
    expect(init.method).toBe("POST");
    const payload = JSON.parse(String(init.body)) as {
      to: Array<{ email_address: { address: string; name: string } }>;
      merge_info: { otp: string; email: string; expiryMinutes: string };
    };
    expect(payload.to[0]?.email_address).toEqual({
      address: "allowed@example.org", name: "allowed@example.org",
    });
    expect(payload.merge_info).toEqual({
      otp: "123456", learnerName: "Recruiter", email: "allowed@example.org",
      mobile: "", expiryMinutes: "10",
    });
  });

  it("REC-JOIN-DELIVERY-19 never confuses rejected HTTP or ambiguous transport failure with a sent code", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockRejectedValueOnce(new Error("Secret provider payload"));
    await expect(deliverPublicRecruiterJoinCode(
      "allowed@example.org", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(false);
    await expect(deliverPublicRecruiterJoinCode(
      "allowed@example.org", "123456", fetchMock as unknown as typeof fetch,
    )).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
