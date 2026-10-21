jest.mock("@/utils/authUtils", () => ({ getAccessToken: jest.fn(() => "test-token") }));

import {
  reportJsError,
  reportUnhandledRejection,
  reportReactBoundaryError,
  reportConsoleError,
  reportResourceLoadFailure,
  reportApiFailure,
  reportAuthFailureMidAction,
  reportVideoPlaybackFailure,
  reportFileUploadFailure,
  initClientErrorReporting,
} from "../clientErrorReporting";
import { getAccessToken } from "@/utils/authUtils";

describe("clientErrorReporting", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    getAccessToken.mockReturnValue("test-token");
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  function lastFetchBody() {
    const [, options] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    return JSON.parse(options.body);
  }

  test("reportJsError posts a JS_ERROR report with page/browser/build enrichment", () => {
    reportJsError("Something broke", "at foo.js:1:1");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = lastFetchBody();
    expect(body.type).toBe("JS_ERROR");
    expect(body.message).toBe("Something broke");
    expect(body.stack).toContain("foo.js");
    expect(body.page).toBeDefined();
    expect(body.browser).toBeDefined();
    expect(body.viewport).toMatch(/^\d+x\d+$/);
  });

  test("reportUnhandledRejection extracts message/stack from an Error reason", () => {
    reportUnhandledRejection(new Error("rejected"));
    const body = lastFetchBody();
    expect(body.type).toBe("UNHANDLED_REJECTION");
    expect(body.message).toBe("rejected");
  });

  test("a route change cancelled by an unsaved-changes guard is not reported as an error", () => {
    reportUnhandledRejection("Route change aborted to preserve unsaved placement settings.");
    reportUnhandledRejection("Route change aborted by Projects unsaved-changes guard.");
    expect(global.fetch).not.toHaveBeenCalled();
    reportUnhandledRejection("Route change failed for another reason");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("reportUnhandledRejection handles a non-Error rejection reason", () => {
    reportUnhandledRejection("plain string reason");
    const body = lastFetchBody();
    expect(body.message).toBe("plain string reason");
  });

  test("reportReactBoundaryError reports as JS_ERROR with the component stack as fallback", () => {
    reportReactBoundaryError(new Error("render blew up"), { componentStack: "in Foo" });
    const body = lastFetchBody();
    expect(body.type).toBe("JS_ERROR");
    expect(body.message).toBe("render blew up");
  });

  test("reportConsoleError pulls message/stack off an Error argument", () => {
    reportConsoleError([new Error("console boom")]);
    const body = lastFetchBody();
    expect(body.type).toBe("CONSOLE_ERROR");
    expect(body.message).toBe("console boom");
  });

  test("reportConsoleError falls back to stringifying a non-Error argument", () => {
    reportConsoleError(["plain warning text"]);
    const body = lastFetchBody();
    expect(body.message).toBe("plain warning text");
  });

  test("reportResourceLoadFailure describes the failed element", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/broken.png";
    reportResourceLoadFailure(img);
    const body = lastFetchBody();
    expect(body.type).toBe("RESOURCE_LOAD_FAILURE");
    expect(body.message).toContain("broken.png");
  });

  test("reportApiFailure carries endpoint/method/statusCode", () => {
    reportApiFailure({ endpoint: "/api/v1/x", method: "post", statusCode: 500, message: "Server error" });
    const body = lastFetchBody();
    expect(body.type).toBe("API_FAILURE");
    expect(body.endpoint).toBe("post /api/v1/x");
    expect(body.statusCode).toBe(500);
  });

  test("reportAuthFailureMidAction reports the AUTH_FAILURE type", () => {
    reportAuthFailureMidAction("/dashboard");
    const body = lastFetchBody();
    expect(body.type).toBe("AUTH_FAILURE");
    expect(body.page).toBe("/dashboard");
  });

  test("reportVideoPlaybackFailure carries the video src and error code", () => {
    reportVideoPlaybackFailure("https://cdn.example.com/lesson.mp4", 4);
    const body = lastFetchBody();
    expect(body.type).toBe("VIDEO_PLAYBACK_FAILURE");
    expect(body.message).toContain("lesson.mp4");
    expect(body.message).toContain("4");
  });

  test("reportFileUploadFailure carries fileName/endpoint/statusCode", () => {
    reportFileUploadFailure({ fileName: "resume.pdf", endpoint: "presign-upload", statusCode: 500, message: "Upload failed: 500" });
    const body = lastFetchBody();
    expect(body.type).toBe("FILE_UPLOAD_FAILURE");
    expect(body.endpoint).toBe("presign-upload");
    expect(body.statusCode).toBe(500);
  });

  test("does not report at all when there is no access token (not logged in)", () => {
    getAccessToken.mockReturnValue(null);
    reportJsError("should not send");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("the exact same error+page is deduped within the dedupe window", () => {
    reportJsError("Repeated error");
    reportJsError("Repeated error");
    reportJsError("Repeated error");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("different messages are not deduped against each other", () => {
    reportJsError("Error A");
    reportJsError("Error B");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("a fetch rejection never throws back into the caller", () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
    expect(() => reportJsError("boom")).not.toThrow();
  });

  test("initClientErrorReporting wraps console.error without breaking it and without throwing", () => {
    const originalConsoleError = console.error;
    try {
      initClientErrorReporting();
      expect(() => console.error("still works", new Error("logged via console"))).not.toThrow();
      expect(global.fetch).toHaveBeenCalled();
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("initClientErrorReporting is idempotent (safe to call more than once)", () => {
    expect(() => {
      initClientErrorReporting();
      initClientErrorReporting();
    }).not.toThrow();
  });
});
