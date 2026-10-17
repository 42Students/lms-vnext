import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { apiFetch } from "@/lib/api-fetch";
import { friendlyApiError, FRIENDLY_MESSAGES, friendlyReference } from "@/lib/friendly-error";
import { createRequestId } from "@/lib/request-id";
import { validateForm, getFieldErrorProps } from "@/lib/form-validation";
import { safeReturnTo, sessionExpiredHref } from "@/lib/return-to";
import { isDatabaseUnavailableError } from "@/lib/db-outage";
import { isStaleChunkError } from "@/components/public/graceful-error-boundary";
import { InlineNotice } from "@/components/ui/inline-notice";
import { conflictMessage, mergeLocalEdits, isConflictError } from "@/lib/conflict-recovery";
import { FriendlyFetchError } from "@/lib/api-fetch";
import { withIdempotencyKey } from "@/lib/action-idempotency";
import { validateUpload } from "@/lib/upload-validation";
import { outboundFetch } from "@/lib/outbound";
import { isRetryableTransactionError, withTransactionRetry } from "@/lib/transaction-retry";
import { parseStoredDraft } from "@/hooks/use-form-draft";
import { fetchDownload } from "@/lib/safe-download";

const source = (path: string): string => readFileSync(path, "utf8");

describe("chat-14 graceful shared-layer edge regression audit", () => {
  it("GR-01 keeps the domain override but never returns an unknown provider code", () => {
    expect(friendlyApiError({ status: 409, code: "TPO_CRM_CONTACT_REQUIRED" }))
      .toBe("Please add a contact before continuing.");
    expect(friendlyApiError({ status: 409, code: "SOME_PROVIDER_SQL_EXCEPTION" }))
      .toBe(FRIENDLY_MESSAGES.conflict);
  });

  it("GR-02 never allows domain codes to override 5xx or offline fallback", () => {
    expect(friendlyApiError({ status: 500, code: "TPO_CRM_CONTACT_REQUIRED" }))
      .toBe(FRIENDLY_MESSAGES.unexpected);
    expect(friendlyApiError({ status: 503, network: true }))
      .toBe(FRIENDLY_MESSAGES.offline);
  });

  it("GR-03 sanitizes technical fallback text for arbitrary codes", () => {
    for (const code of ["SQL_EXCEPTION", "ECONNRESET", "INTERNAL_ERROR", "__proto__"]) {
      const message = friendlyApiError({ code, status: 400 });
      expect(message).not.toMatch(/Error:|Exception|SELECT |ECONN|undefined|null|NaN|\[object|^[A-Z_]{6,}$/i);
    }
  });

  it("GR-04 treats an invalid JSON body as an upstream failure even for HTTP 200", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html>gateway response</html>", { status: 200 }),
    );
    try {
      await expect(apiFetch("/api/safe")).rejects.toMatchObject({
        status: 502, message: FRIENDLY_MESSAGES.unexpected,
      });
    } finally { spy.mockRestore(); }
  });

  it("GR-05 rejects unsafe reference strings and correlates server header", () => {
    const id = createRequestId();
    expect(friendlyReference(id)).toBe(`Reference: ${id}`);
    expect(friendlyReference("SELECT secret FROM users")).toBeNull();
    expect(source("src/lib/api-error.ts")).toContain('headers.set("x-request-id", requestId)');
  });

  it("GR-06 never serializes unknown error.message as the customer message", () => {
    const code = source("src/lib/api-error.ts");
    expect(code).toContain("friendlyApiError({ status, code })");
    expect(code).not.toContain("message: error.message");
  });

  it("GR-07 uses field-level validation rather than returning SQL or provider text", () => {
    const code = source("src/lib/api-error.ts");
    expect(code).toContain('issue.path.join(".")');
    expect(code).toContain('"Please check this field."');
  });

  it("GR-08 route wrappers return structured safe responses after exceptions", () => {
    const code = source("src/lib/with-api-guard.ts");
    expect(code).toContain("return apiErrorResponse(error)");
    expect(code).toContain("logError(\"action.unhandled_error\"");
  });

  it("GR-09 records immutable baselines and detects new JSX raw-error renderings", () => {
    const code = source("tests/unit/graceful-raw-error-scan.test.ts");
    expect(code).toContain("blobHash(content) !== baseline[file]");
    expect(code).toContain("rawErrorPatterns.some");
  });

  it("GR-10 shows a non-auto-dismissing alert with keyboard dismiss", () => {
    const html = renderToStaticMarkup(createElement(InlineNotice, {
      tone: "error", message: "Please retry.", onDismiss: () => {},
    }));
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-label="Dismiss notice"');
    expect(source("src/components/ui/inline-notice.tsx")).toContain('tone !== "success"');
  });

  it("GR-11 reports a safe browser category and not a stack or exception message", () => {
    const code = source("src/components/public/graceful-error-boundary.tsx");
    expect(code).toContain('message: "A page could not be displayed."');
    expect(code).not.toContain("message: error.message");
    expect(code).toContain('fetch("/api/client-errors"');
  });

  it("GR-12 treats dynamic-import failures as stale chunks, not ordinary validation", () => {
    expect(isStaleChunkError(new Error("Importing a module script failed"))).toBe(true);
    expect(isStaleChunkError(new Error("Please check the highlighted fields"))).toBe(false);
    expect(source("src/components/public/graceful-error-boundary.tsx"))
      .toContain('sessionStorage.setItem(key, "yes")');
  });

  it("GR-15 never returns to outside sites, auth routes or API endpoints", () => {
    for (const path of ["https://outside.invalid", "//outside.invalid", "/api/secrets", "/login", "/"]) {
      expect(safeReturnTo(path)).toBeNull();
    }
    expect(sessionExpiredHref("/learn/assignments?status=draft"))
      .toContain("returnTo=%2Flearn%2Fassignments%3Fstatus%3Ddraft");
  });

  it("GR-16 removes offline notice listeners after unmount", () => {
    const code = source("src/components/public/offline-banner.tsx");
    expect(code).toContain('addEventListener("offline", update)');
    expect(code).toContain('removeEventListener("online", update)');
    expect(code).toContain('role="alert"');
  });

  it("GR-17 maintenance excludes readiness and returns a retryable no-store 503", () => {
    const code = source("src/proxy.ts");
    expect(code).toContain('path !== "/ready"');
    expect(code).toContain('status: 503');
    expect(code).toContain('"cache-control": "no-store"');
    expect(code).toContain('"retry-after": "60"');
  });

  it("GR-18 distinguishes connection failure from a unique constraint violation", () => {
    expect(isDatabaseUnavailableError({ cause: { code: "08006" } })).toBe(true);
    expect(isDatabaseUnavailableError({ code: "23505" })).toBe(false);
  });

  it("GR-22 has a plain no-script fallback on the root page", () => {
    expect(source("src/app/layout.tsx")).toContain(
      "<noscript>Please enable JavaScript to use the LMS.</noscript>",
    );
  });

  it("GR-23 leaves actionable browser-update wording in the compatibility notice", () => {
    expect(source("src/components/public/browser-support-notice.tsx"))
      .toContain("Please update your browser");
  });

  it("GR-30 has a synchronous reentrancy lock and a finally unlock", () => {
    const code = source("src/hooks/use-guarded-action.ts");
    expect(code).toContain("if (inFlight.current) return undefined");
    expect(code).toContain("inFlight.current = false");
    expect(code).toContain("setPending(false)");
  });

  it("GR-32 re-applies a local draft without losing untouched server fields", () => {
    expect(isConflictError(new FriendlyFetchError(conflictMessage, 409))).toBe(true);
    expect(mergeLocalEdits({ title: "server", body: "updated" }, { title: "my edit" }))
      .toEqual({ title: "my edit", body: "updated" });
  });

  it("GR-33 returns field-specific Zod feedback with accessible input references", () => {
    const result = validateForm(z.object({ title: z.string().min(1) }), { title: "" });
    expect(result).toMatchObject({ success: false, fieldErrors: { title: "Please check this field." } });
    expect(getFieldErrorProps("title", result.fieldErrors))
      .toEqual({ "aria-invalid": true, "aria-describedby": "title-error" });
  });

  it("GR-34 retains other HTTP headers when attaching the mutation key", () => {
    const init = withIdempotencyKey({
      method: "POST", headers: { "Content-Type": "application/json" },
    }, "abc123");
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Idempotency-Key")).toBe("abc123");
  });

  it("GR-40 blocks unsupported and oversized uploads and maps every HTTP failure safely", () => {
    const file = { size: 2000, type: "application/pdf" };
    expect(validateUpload(file, { maxBytes: 1000, allowedTypes: ["application/pdf"] }).ok).toBe(false);
    expect(validateUpload(file, { maxBytes: 3000, allowedTypes: ["image/png"] }).ok).toBe(false);
    const code = source("src/lib/upload-progress.ts");
    expect(code).toContain("friendlyApiError({");
    expect(code).toContain("status: xhr.status || undefined");
    expect(code).not.toContain("xhr.status === 503 ?");
  });

  it("GR-54 applies the retry guidance to rate-limited uploads and API responses", () => {
    expect(friendlyApiError({ status: 429 })).toBe(FRIENDLY_MESSAGES.rateLimit);
    expect(source("src/lib/upload-progress.ts")).toContain("friendlyApiError({");
    expect(source("src/lib/api-error.ts")).toContain('headers.set("Retry-After", "60")');
  });

  it("GR-50 retries a keyed provider POST but not a duplicate-prone unkeyed POST", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    try {
      const result = await outboundFetch("https://example.invalid", {
        method: "POST", idempotencyKey: "safe-key", maxAttempts: 2, baseDelayMs: 0,
      });
      expect(result.status).toBe(200);
      const unkeyed = await outboundFetch("https://example.invalid", {
        method: "POST", maxAttempts: 3, baseDelayMs: 0,
      });
      expect(unkeyed.status).toBe(503);
      expect(spy).toHaveBeenCalledTimes(3);
    } finally { spy.mockRestore(); }
  });

  it("GR-52 retries serialization faults but immediately rejects a constraint error", async () => {
    expect(isRetryableTransactionError({ code: "40P01" })).toBe(true);
    expect(isRetryableTransactionError({ code: "23503" })).toBe(false);
    const operation = vi.fn().mockRejectedValueOnce({ code: "40001" })
      .mockResolvedValueOnce("saved");
    await expect(withTransactionRetry(operation, { baseDelayMs: 0 })).resolves.toBe("saved");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("GR-60 restores valid local data and keeps new typing ahead of late hydration", () => {
    expect(parseStoredDraft<{ title: string }>('{"title":"saved"}')).toEqual({ title: "saved" });
    expect(parseStoredDraft("not json")).toBeNull();
    const code = source("src/hooks/use-form-draft.ts");
    expect(code).toContain("editedBeforeRestore.current");
    expect(code).toContain("latestDraft.current = value");
    expect(code).toContain("dirtyRef.current = true");
  });

  it("GR-62 flushes the current draft during pagehide and before leaving", () => {
    const code = source("src/hooks/use-form-draft.ts");
    expect(code).toContain('window.addEventListener("pagehide", flushDraft)');
    expect(code).toContain('window.addEventListener("beforeunload", warn)');
    expect(code).toContain("flushDraft();");
    expect(code).toContain("if (cleared.current || !dirtyRef.current) return;");
    expect(code).toContain("localStorage.removeItem(storageKey)");
  });

  it("GR-64 never treats HTML as a valid downloaded file", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html>temporarily unavailable</html>", {
        status: 200, headers: { "content-type": "text/html" },
      }),
    );
    try {
      await expect(fetchDownload("/api/export")).rejects.toMatchObject({
        status: 502, message: FRIENDLY_MESSAGES.unexpected,
      });
    } finally { spy.mockRestore(); }
  });
});
