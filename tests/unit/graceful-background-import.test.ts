import { describe, expect, it, vi } from "vitest";
import { runBackgroundJob } from "@/lib/background-job";
import { previewImport, applyImportAtomically, importIssuesCsv } from "@/lib/import-preview";

describe("graceful background and bulk import", () => {
  it("GR-55 isolates scheduled failures and retries only idempotent operations", async () => {
    const unkeyed = vi.fn().mockRejectedValue(new Error("provider unavailable"));
    const first = await runBackgroundJob("test", unkeyed, { maxAttempts: 3, delayMs: 0 });
    expect(first.ok).toBe(false);
    expect(unkeyed).toHaveBeenCalledTimes(1);
    const keyed = vi.fn().mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce("sent");
    const second = await runBackgroundJob("test", keyed, {
      idempotent: true, maxAttempts: 2, delayMs: 0,
    });
    expect(second).toMatchObject({ ok: true, data: "sent" });
    expect(second.requestId).toMatch(/^[a-f0-9]{8}$/);
  });

  it("GR-63 refuses a partial import and exports safe per-row errors", async () => {
    const preview = previewImport([{ email: "valid" }, { email: "" }], (row, number) =>
      row.email ? [] : [{ row: number, field: "email", message: "internal SELECT exception" }]);
    expect(preview.valid).toBe(false);
    expect(preview.issues).toEqual([
      { row: 2, field: "email", message: "Please check this field and try again." },
    ]);
    const apply = vi.fn().mockResolvedValue("ok");
    await expect(applyImportAtomically(preview, apply)).rejects.toThrow("Please check");
    expect(apply).not.toHaveBeenCalled();
    expect(importIssuesCsv(preview.issues)).toContain("Row,Field,Message");
    expect(importIssuesCsv(preview.issues)).not.toContain("internal");
  });
  it("GR-63 submits all validated rows to one caller-owned transaction", async () => {
    const preview = previewImport([1, 2, 3], () => []);
    const apply = vi.fn().mockResolvedValue(3);
    expect(await applyImportAtomically(preview, apply)).toBe(3);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith([1, 2, 3]);
  });
});
