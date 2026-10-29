import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  execute: vi.fn(),
  log: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/outbound", () => ({ outboundFetch: mocks.fetch }));
vi.mock("@/db/client", () => ({
  getDb: () => ({ execute: mocks.execute }),
}));
vi.mock("@/observability/logger", () => ({ writeStructuredLog: mocks.log }));

import { createExotelSmsProvider, appendSmsDeliveryAttempt } from
  "@/modules/notifications/exotel-sms";

const config = {
  apiKey: "fake-id", apiToken: "fake-secret", accountSid: "test-account",
  dltEntityId: "1234567890", otpSenderId: "TESTER",
  otpDltTemplateId: "otp-template", smsType: "transactional_opt_in",
};
const dialect = new PgDialect();

describe("DB-031 Exotel acceptance versus privacy-safe attempt audit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.execute.mockResolvedValue({ rows: [{ ready: true }] });
  });

  it("audits canonical trimmed provider ID after the same SID was accepted by Exotel parser", async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
      SMSMessage: { Sid: "  SM-123 \n", Status: "queued" },
    }), { status: 200 }));
    const accepted = await createExotelSmsProvider(config).sendOtp("+919876543210", "123456");
    expect(accepted).toBe(true);
    expect(mocks.execute).toHaveBeenCalledTimes(2);
    const insert = dialect.sqlToQuery(mocks.execute.mock.calls[1]![0]);
    expect(insert.sql).toContain("insert into messaging_sms_delivery_attempts");
    expect(insert.params).toContain("SM-123");
    expect(insert.params).not.toContain("  SM-123 \n");
    expect(insert.params).toContain("3210");
    expect(insert.params).not.toContain("+919876543210");
    expect(insert.params).not.toContain("123456");
  });

  it("does not truncate a provider-accepted 65-char SID to a misleading 64-char ledger ID", async () => {
    const sid = "S".repeat(65);
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
      SMSMessage: { Sid: sid, Status: "queued" },
    }), { status: 200 }));
    expect(await createExotelSmsProvider(config).sendOtp("+919876543210", "123456"))
      .toBe(true);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledWith(
      "WARNING", "sms.delivery_attempt_ledger_invalid",
      { purpose: "otp", reason: "ATTEMPT_AUDIT_VALIDATION_FAILED" },
    );
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain(sid);
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("+919876543210");
  });

  it("rejects runtime-forged audit inputs without database access or PII logging", async () => {
    expect(await appendSmsDeliveryAttempt({
      purpose: "otp", recipient: "+919876543210",
      outcome: "PROVIDER_ACCEPTED", providerSid: "attacker phone=+919876543210",
    })).toBe("FAILED");
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("+919876543210");
  });
});
