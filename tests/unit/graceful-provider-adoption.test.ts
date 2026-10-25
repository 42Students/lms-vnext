import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (p: string) => readFileSync(p, "utf8");

describe("graceful outbound provider adoption", () => {
  it("GR-50 Exotel OTP goes through the bounded outbound transport", () => {
    const sms = source("src/modules/notifications/exotel-sms.ts");
    expect(sms).toContain("outboundFetch(");
    expect(sms).toContain("maxAttempts: 1");
    expect(sms).toContain("fetchImpl,");
  });
  it("GR-50 ZeptoMail OTP goes through the bounded outbound transport", () => {
    const email = source("src/modules/notifications/zeptomail-email.ts");
    expect(email).toContain("outboundFetch(");
    expect(email).toContain("maxAttempts: canRetry?3:1");
    expect(email).toContain('purpose.kind!=="OTP"');
    expect(email).toContain('env["ZEPTOMAIL_IDEMPOTENCY_SUPPORTED"]==="confirmed"');
    expect(email).toContain('typeof message.idempotencyKey==="string"');
    expect(email).toContain("idempotencyKey:message.idempotencyKey");
    expect(email).toContain("fetchImpl,");
  });
  it("GR-50 campaign outbound calls avoid duplicate unkeyed POST retries", () => {
    const campaign = source("src/modules/messaging/providers.ts");
    expect(campaign.match(/outboundFetch\(/g)?.length).toBe(1);
    expect(campaign.match(/maxAttempts: 1/g)?.length).toBe(1);
  });
});
