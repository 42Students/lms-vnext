import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { InlineNotice } from "@/components/ui/inline-notice";
import { conflictMessage, isConflictError, mergeLocalEdits } from "@/lib/conflict-recovery";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { FriendlyFetchError } from "@/lib/api-fetch";
import { validateForm, getFieldErrorProps } from "@/lib/form-validation";
import { createIdempotencyKey, withIdempotencyKey } from "@/lib/action-idempotency";
import { outboundFetch } from "@/lib/outbound";
import { isRetryableTransactionError, withTransactionRetry } from "@/lib/transaction-retry";
import { parseStoredDraft } from "@/hooks/use-form-draft";

describe("graceful action helpers", () => {
  it("GR-10 announces errors and success with distinct roles", () => {
    expect(renderToStaticMarkup(createElement(InlineNotice, { tone: "error", message: "Try again." })))
      .toContain('role="alert"');
    expect(renderToStaticMarkup(createElement(InlineNotice, { tone: "success", message: "Saved." })))
      .toContain('role="status"');
  });
  it("GR-30 provides a synchronous reentrancy guard and a timeout safety path", async () => {
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/hooks/use-guarded-action.ts", "utf8");
    expect(source).toContain("if (inFlight.current) return undefined");
    expect(source).toContain("Promise.race");
    expect(source).toContain("inFlight.current = false");
  });
  it("GR-32 keeps local edits when applying refreshed server state after 409", () => {
    expect(isConflictError(new FriendlyFetchError(conflictMessage, 409))).toBe(true);
    expect(mergeLocalEdits({ title: "Changed", description: "New server text" }, { title: "My draft" }))
      .toEqual({ title: "My draft", description: "New server text" });
    expect(conflictMessage).toBe(FRIENDLY_MESSAGES.conflict);
  });
  it("GR-33 uses the shared Zod schema for inline validation", () => {
    const schema = z.object({ title: z.string().min(2) });
    const result = validateForm(schema, { title: "" });
    expect(result.success).toBe(false);
    expect(result.fieldErrors.title).toBe("Please check this field.");
    expect(getFieldErrorProps("title", result.fieldErrors))
      .toEqual({ "aria-invalid": true, "aria-describedby": "title-error" });
  });
  it("GR-34 attaches a unique idempotency key", () => {
    const key = createIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    const request = withIdempotencyKey({ method: "POST" }, key);
    expect(new Headers((request as { headers?: HeadersInit }).headers).get("Idempotency-Key")).toBe(key);
  });
  it("GR-50 retries idempotent transient failures, not unkeyed POST calls", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 503 }));
    try {
      const retry = await outboundFetch("https://example.invalid", { method: "GET", maxAttempts: 2, baseDelayMs: 0 });
      expect(retry.status).toBe(200);
      const noRetry = await outboundFetch("https://example.invalid", { method: "POST", maxAttempts: 3 });
      expect(noRetry.status).toBe(503);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally { fetchMock.mockRestore(); }
  });
  it("GR-52 retries a deadlock but never a unique constraint violation", async () => {
    expect(isRetryableTransactionError({ code: "40P01" })).toBe(true);
    expect(isRetryableTransactionError({ code: "23505" })).toBe(false);
    const operation = vi.fn().mockRejectedValueOnce({ code: "40001" }).mockResolvedValueOnce("saved");
    await expect(withTransactionRetry(operation, { baseDelayMs: 0 })).resolves.toBe("saved");
    expect(operation).toHaveBeenCalledTimes(2);
  });
  it("GR-60 restores valid local JSON without crashing on corruption", () => {
    expect(parseStoredDraft<{ title: string }>('{"title":"My draft"}')).toEqual({ title: "My draft" });
    expect(parseStoredDraft("not JSON")).toBeNull();
  });
});
