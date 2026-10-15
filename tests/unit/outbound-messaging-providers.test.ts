import { describe, expect, it, vi } from "vitest";
import { createOutboundProvider, type OutboundProviderConfig } from "@/modules/messaging/providers";
const config: OutboundProviderConfig = {
  email: { apiUrl: "https://api.zeptomail.in/v1.1/email/template", token: "test-only", otpTemplateKey: "otp", fromAddress: "test@example.com", fromName: "Test" },
  sms: { apiKey: "", apiToken: "", accountSid: "test", dltEntityId: "", otpSenderId: "", otpDltTemplateId: "", smsType: "transactional_opt_in" },
  templates: { notice: { zeptoTemplateKey: "notice-registered" } },
};
const req = { channel: "EMAIL" as const, recipient: "test@example.com", templateKey: "notice", variables: { name: "Tester" }, purpose: "notification" };
describe("messaging provider adapter", () => {
  it("uses the registered campaign template instead of OTP", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("{}", { status: 200 }));
    expect(await createOutboundProvider(config, fetcher as typeof fetch).send(req)).toBe(true);
    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body)).template_key).toBe("notice-registered");
  });
  it("fails closed if template is absent and never calls network", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response());
    expect(await createOutboundProvider(config, fetcher as typeof fetch).send({ ...req, templateKey: "missing" })).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects missing Exotel DLT configuration", async () => {
    const fetcher = vi.fn(async () => new Response());
    expect(await createOutboundProvider(config, fetcher as typeof fetch).send({ ...req, channel: "SMS", recipient: "+919999999999" })).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
