import { describe, expect, it, vi } from "vitest";
import { FRIENDLY_MESSAGES, friendlyApiError, friendlyReference } from "@/lib/friendly-error";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { createRequestId, responseWithRequestId } from "@/lib/request-id";

describe("graceful API helpers", () => {
  it("GR-01 domain wording overrides generic fallback", () => {
    expect(friendlyApiError({ status: 422, code: "TPO_CRM_CONTACT_REQUIRED" }))
      .toBe("Please add a contact before continuing.");
    expect(friendlyApiError({ status: 422, code: "UNRECOGNIZED_PROVIDER_CODE" }))
      .toBe(FRIENDLY_MESSAGES.unprocessable);
  });
  it("GR-02 maps network, session, permissions, record, conflict, upload, validation, rate-limit and outages", () => {
    const cases: Array<[number, keyof typeof FRIENDLY_MESSAGES]> = [
      [400, "invalid"], [401, "session"], [403, "forbidden"], [404, "missing"],
      [409, "conflict"], [413, "tooLarge"], [415, "fileType"], [422, "unprocessable"],
      [429, "rateLimit"], [500, "unexpected"], [502, "unexpected"],
      [503, "maintenance"], [504, "timeout"],
    ];
    for (const [status, expected] of cases)
      expect(friendlyApiError({ status })).toBe(FRIENDLY_MESSAGES[expected]);
    expect(friendlyApiError({ network: true })).toBe(FRIENDLY_MESSAGES.offline);
    expect(friendlyApiError({ code: "INTERNAL_ERROR" })).toBe(FRIENDLY_MESSAGES.unexpected);
  });
  it("GR-03 never exposes raw codes or technical words", () => {
    const all = [
      ...Object.values(FRIENDLY_MESSAGES),
      ...[400, 401, 403, 404, 409, 413, 415, 422, 429, 500, 503, 504]
        .map((status) => friendlyApiError({ status, code: "ECONNRESET" })),
      friendlyApiError({ code: "UNKNOWN_DATABASE_EXCEPTION" }),
    ];
    const forbidden = /^[A-Z0-9_]{6,}$|Error:|Exception| at |SELECT |relation |violates|ECONN|undefined|null|NaN|\[object/i;
    for (const message of all) expect(message).not.toMatch(forbidden);
  });
  it("GR-05 generates opaque, short references and adds header", () => {
    const id = createRequestId();
    expect(id).toMatch(/^[a-f0-9]{8}$/);
    expect(friendlyReference(id)).toBe(`Reference: ${id}`);
    expect(friendlyReference("DATABASE_EXCEPTION")).toBeNull();
    const response = responseWithRequestId(new Response("ok"), id);
    expect(response.headers.get("x-request-id")).toBe(id);
  });
  it("GR-04 catches HTML responses and exposes only a friendly error", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html>Bad gateway</html>", { status: 502, headers: { "content-type": "text/html" } }),
    );
    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      message: FRIENDLY_MESSAGES.unexpected, status: 502,
    });
    fetchMock.mockRestore();
  });
  it("GR-04 accepts JSON and carries safe metadata for a failed request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ error: "INVALID_REQUEST", requestId: "abcdef12", fieldErrors: { email: "Enter an email address." } }, { status: 400 }),
    );
    try {
      await apiFetch("/api/test");
      throw new Error("Expected rejection");
    } catch (reason) {
      expect(reason).toBeInstanceOf(FriendlyFetchError);
      expect(reason).toMatchObject({
        message: FRIENDLY_MESSAGES.invalid, requestId: "abcdef12",
        fieldErrors: { email: "Enter an email address." },
      });
    } finally {
      fetchMock.mockRestore();
    }
  });
  it("GR-04 makes a network failure safe", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("ECONNRESET"));
    await expect(apiFetch("/api/test")).rejects.toMatchObject({
      message: FRIENDLY_MESSAGES.offline, status: 0,
    });
    fetchMock.mockRestore();
  });
});
