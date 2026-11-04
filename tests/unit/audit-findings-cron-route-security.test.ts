import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/internal/audit-findings/sync/route";
import {
  independentAuditImporterReady,
  syncIndependentAuditInbox,
} from "@/modules/bug-tracker/independent-audit-inbox-importer";

vi.mock("@/modules/bug-tracker/independent-audit-inbox-importer", () => ({
  independentAuditImporterReady: vi.fn(),
  syncIndependentAuditInbox: vi.fn(),
}));

const token = "audit-cron-route-test-credential-" + "x".repeat(32);
const previousToken = process.env["AUDIT_FINDINGS_CRON_SECRET"];

function request(headers: Record<string, string> = {}, query = "") {
  return new Request(`https://lms.example.com/api/internal/audit-findings/sync${query}`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}`, ...headers },
  });
}

describe("audit findings machine-only sync API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env["AUDIT_FINDINGS_CRON_SECRET"] = token;
    vi.mocked(independentAuditImporterReady).mockReturnValue(true);
    vi.mocked(syncIndependentAuditInbox).mockResolvedValue({
      ran: true, busy: false, commit: "abc", imported: 0, updates: 0,
      refused: 0, tampered: 0, deleted: 0, message: "SUCCESS",
    });
  });

  afterEach(() => {
    if (previousToken === undefined) delete process.env["AUDIT_FINDINGS_CRON_SECRET"];
    else process.env["AUDIT_FINDINGS_CRON_SECRET"] = previousToken;
  });

  it("rejects missing, wrong and browser-origin credentials before touching the importer", async () => {
    for (const headers of [
      { authorization: "" },
      { authorization: "Bearer wrong" },
      { origin: "https://lms.example.com" },
      { origin: "https://other.example.com" },
    ]) {
      const response = await GET(request(headers));
      expect(response.status).toBe(401);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      expect(await response.json()).toEqual({ error: "UNAUTHORIZED" });
    }
    expect(independentAuditImporterReady).not.toHaveBeenCalled();
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("rejects query/body metadata before checking ready state or writing", async () => {
    for (const [headers, query] of [
      [{}, "?tenant=foreign"],
      [{ "content-length": "5" }, ""],
      [{ "transfer-encoding": "chunked" }, ""],
    ] as const) {
      const response = await GET(request(headers, query));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "INVALID_REQUEST" });
    }
    expect(independentAuditImporterReady).not.toHaveBeenCalled();
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("rejects a weak deployed credential without dispatching the importer", async () => {
    process.env["AUDIT_FINDINGS_CRON_SECRET"] = "short";
    const response = await GET(request({ authorization: "Bearer short" }));
    expect(response.status).toBe(401);
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();
  });

  it("executes only authorized empty GET and preserves private no-store responses", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(independentAuditImporterReady).toHaveBeenCalledOnce();
    expect(syncIndependentAuditInbox).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({ result: { ran: true, busy: false } });
  });

  it("fails closed on disabled importer or provider error without leaking internals", async () => {
    vi.mocked(independentAuditImporterReady).mockReturnValueOnce(false);
    const disabled = await GET(request());
    expect(disabled.status).toBe(503);
    expect(await disabled.json()).toEqual({ error: "IMPORTER_NOT_READY" });
    expect(syncIndependentAuditInbox).not.toHaveBeenCalled();

    vi.mocked(syncIndependentAuditInbox).mockRejectedValueOnce(
      new Error("private-token-and-sql-error"),
    );
    const failed = await GET(request());
    expect(failed.status).toBe(500);
    const body = await failed.text();
    expect(body).toContain("IMPORT_FAILED");
    expect(body).not.toContain("private-token-and-sql-error");
    expect(failed.headers.get("Cache-Control")).toContain("no-store");
  });
});
