import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validateOutboundDispatchDbConfig } from
  "@/modules/operations/outbound-dispatch-principal";

const valid = {
  DB10_DISPATCH_DATABASE_URL:
    "postgresql://lms_dispatch_worker:disposable-test-secret@127.0.0.1:5432/lms_vnext_test",
  DB10_DISPATCH_DB_ROLE: "lms_dispatch_worker",
  DATABASE_URL: "postgresql://app_user:other-secret@127.0.0.1:5432/lms_vnext_test",
};

describe("DB018 dedicated dispatch database identity", () => {
  it("requires an explicit independent login and never falls back to the app pool", () => {
    expect(validateOutboundDispatchDbConfig(valid)).toMatchObject({
      login: "lms_dispatch_worker",
      url: valid.DB10_DISPATCH_DATABASE_URL,
    });
    for (const override of [
      { DATABASE_URL:
        "postgresql://app_user:other-secret@wrong.example.test:5432/lms_vnext_test" },
      { DATABASE_URL:
        "postgresql://app_user:other-secret@127.0.0.1:5432/different_test" },
      { DATABASE_URL:valid.DB10_DISPATCH_DATABASE_URL,
        DB10_APP_DB_ROLE:"app_user" },
      { DB10_DISPATCH_DATABASE_URL: undefined },
      { DB10_DISPATCH_DB_ROLE: undefined },
      { DB10_DISPATCH_DB_ROLE: "app_user" },
      { DB10_APP_DB_ROLE: "lms_dispatch_worker" },
      { DATABASE_URL: undefined },
      { DB10_DISPATCH_DATABASE_URL:
        "postgresql://app_user:some-secret@127.0.0.1:5432/lms_vnext_test",
        DB10_DISPATCH_DB_ROLE: "app_user" },
      { DB10_DISPATCH_DATABASE_URL:
        "postgresql://postgres:superuser@127.0.0.1:5432/lms_vnext_test",
        DB10_DISPATCH_DB_ROLE: "postgres" },
      { DB10_DISPATCH_DATABASE_URL:
        "postgresql://lms_dispatch_worker:secret@127.0.0.1:5432/lms_vnext_test?options=-c%20role%3Dpostgres" },
      { DB10_DISPATCH_DATABASE_URL:
        "postgresql://lms_dispatch_worker:secret@127.0.0.1:5432/lms_vnext_test#fragment" },
    ]) {
      expect(() => validateOutboundDispatchDbConfig({
        ...valid,
        ...override,
      })).toThrow("OUTBOUND_DISPATCH_PRINCIPAL_NOT_VERIFIED");
    }
  });

  it("accepts an explicit separate app login when Cloud SQL uses discrete env vars", () => {
    const withoutAppUrl = {
      DB10_DISPATCH_DATABASE_URL: valid.DB10_DISPATCH_DATABASE_URL,
      DB10_DISPATCH_DB_ROLE: valid.DB10_DISPATCH_DB_ROLE,
    };
    expect(validateOutboundDispatchDbConfig({
      ...withoutAppUrl,
      DB10_APP_DB_ROLE: "lms_app_api",
    }).login).toBe("lms_dispatch_worker");
    expect(() => validateOutboundDispatchDbConfig(withoutAppUrl))
      .toThrow("OUTBOUND_DISPATCH_PRINCIPAL_NOT_VERIFIED");
  });
});
