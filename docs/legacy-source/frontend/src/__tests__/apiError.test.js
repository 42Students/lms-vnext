import {
  API_ERROR_KIND,
  getApiErrorKind,
  getApiErrorPresentation,
  isAuthError,
} from "@/utils/apiError";

const http = (status, data = {}) => ({ response: { status, data } });

describe("apiError resilience classification", () => {
  test.each([
    [{ code: "ECONNABORTED", message: "timeout of 30000ms exceeded" }, API_ERROR_KIND.TIMEOUT],
    [http(401), API_ERROR_KIND.AUTH],
    [http(403), API_ERROR_KIND.PERMISSION],
    [http(404), API_ERROR_KIND.NOT_FOUND],
    [http(409), API_ERROR_KIND.CONFLICT],
    [http(422), API_ERROR_KIND.VALIDATION],
    [http(429), API_ERROR_KIND.RATE_LIMIT],
    [http(503), API_ERROR_KIND.SERVER],
    [{ code: "ERR_CANCELED", name: "CanceledError" }, API_ERROR_KIND.CANCELED],
  ])("classifies distinct recovery states", (error, expected) => {
    expect(getApiErrorKind(error)).toBe(expected);
  });

  test("distinguishes browser offline from an otherwise unknown network failure", () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, "onLine");
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
    expect(getApiErrorKind(new Error("Network Error"))).toBe(API_ERROR_KIND.OFFLINE);
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
    expect(getApiErrorKind(new Error("Network Error"))).toBe(API_ERROR_KIND.NETWORK);
    if (original) Object.defineProperty(window.navigator, "onLine", original);
  });

  test("treats explicit session-expired 403 as auth, not ordinary permission denial", () => {
    const error = http(403, { code: "SESSION_EXPIRED" });
    expect(isAuthError(error)).toBe(true);
    expect(getApiErrorKind(error)).toBe(API_ERROR_KIND.AUTH);
  });

  test("user presentation never exposes a raw timeout/debug string", () => {
    const view = getApiErrorPresentation(
      { code: "ECONNABORTED", message: "timeout of 30000ms exceeded at Axios.request internal.js:42" }
    );
    expect(view.title).toBe("Request timed out");
    expect(view.message).toMatch(/too long/i);
    expect(view.message).not.toMatch(/Axios|internal\.js|30000/);
    expect(view.retryable).toBe(true);
  });
});
