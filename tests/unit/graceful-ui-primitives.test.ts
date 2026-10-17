import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ComponentType } from "react";
import { readFileSync } from "node:fs";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { DisabledReason } from "@/components/ui/disabled-reason";
import { LongText } from "@/components/ui/long-text";
import { formatCount, formatCurrencyINR, formatDateIST, safeDisplayText, validateDateRange } from "@/lib/safe-format";
import { validateUpload } from "@/lib/upload-validation";
import { fetchDownload } from "@/lib/safe-download";

describe("graceful shared UI primitives", () => {
  it("GR-35 confirms consequences without browser confirm", () => {
    const html = renderToStaticMarkup(createElement(ConfirmActionDialog, {
      open: true, title: "Remove student", consequence: "This removes access.",
      onCancel: () => {}, onConfirm: () => {},
    }));
    expect(html).toContain('role="dialog"');
    expect(html).toContain("This removes access.");
    expect(readFileSync("src/components/ui/confirm-action-dialog.tsx", "utf8")).not.toContain("window.confirm(");
  });
  it("GR-36 explains disabled controls", () => {
    const html = renderToStaticMarkup(createElement(DisabledReason as unknown as ComponentType<Record<string, unknown>>, {
      reason: "Complete your profile first.",
    }, createElement("button", { disabled: true }, "Submit")));
    expect(html).toContain("Complete your profile first.");
    expect(html).toContain("aria-describedby");
  });
  it("GR-37 formats IST dates and explains invalid ranges", () => {
    expect(formatDateIST("2099-02-01T12:00:00Z")).toContain("IST");
    expect(formatDateIST("not-a-date")).toBe("—");
    expect(validateDateRange("2099-02-02", "2099-02-01")).toContain("end date");
  });
  it("GR-38 never renders invalid number or nullable values", () => {
    expect(formatCount(Number.NaN)).toBe("—");
    expect(formatCurrencyINR(null)).toBe("—");
    expect(safeDisplayText({ secret: true })).toBe("—");
    expect(formatCount(0)).toBe("0");
  });
  it("GR-39 long names wrap and have a title", () => {
    const html = renderToStaticMarkup(createElement(LongText, {
      value: "Extremely Long Organization Label",
    }));
    expect(html).toContain("break-words");
    expect(html).toContain('title="Extremely Long Organization Label"');
  });
  it("GR-40 validates size, type and unavailable storage before upload", () => {
    const pdf = { size: 1_000, type: "application/pdf" };
    expect(validateUpload(pdf, { maxBytes: 500, allowedTypes: ["application/pdf"] }).ok).toBe(false);
    expect(validateUpload(pdf, { maxBytes: 2_000, allowedTypes: ["image/png"] }).ok).toBe(false);
    expect(validateUpload(pdf, { maxBytes: 2_000, allowedTypes: ["application/pdf"], available: false }))
      .toMatchObject({ ok: false, message: expect.stringContaining("not available") });
  });
  it("GR-56 third party failure supplies an accessible copy link", () => {
    const source = readFileSync("src/components/ui/third-party-link.tsx", "utf8");
    expect(source).toContain("Copy link");
    expect(source).toContain("The link could not be opened.");
  });
  it("GR-62 warns on unsaved changes and clears successful drafts", () => {
    const source = readFileSync("src/hooks/use-form-draft.ts", "utf8");
    expect(source).toContain('addEventListener("beforeunload"');
    expect(source).toContain("localStorage.removeItem(storageKey)");
  });
  it("GR-64 refuses JSON and HTML exports without downloading them", async () => {
    const mocked = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response('{"error":"INTERNAL_ERROR"}', { status: 200,
        headers: { "content-type": "application/json" } }),
    );
    try {
      await expect(fetchDownload("/api/export")).rejects.toMatchObject({
        status: 502,
      });
    } finally { mocked.mockRestore(); }
  });
});
