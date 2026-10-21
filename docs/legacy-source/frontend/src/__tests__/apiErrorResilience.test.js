import {
  API_ERROR_KIND,
  getApiErrorKind,
  getApiErrorPresentation,
  isConnectivityError,
} from "@/utils/apiError";

const axiosError = ({ status, code, message = "Request failed", data } = {}) => ({
  code,
  message,
  ...(status != null ? { response: { status, data } } : {}),
});

describe("API error resilience contract", () => {
  const setOnline = (value) => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value });
  };

  afterEach(() => setOnline(true));

  test.each([
    [403, API_ERROR_KIND.PERMISSION],
    [404, API_ERROR_KIND.NOT_FOUND],
    [409, API_ERROR_KIND.CONFLICT],
    [422, API_ERROR_KIND.VALIDATION],
    [429, API_ERROR_KIND.RATE_LIMIT],
    [500, API_ERROR_KIND.SERVER],
  ])("maps HTTP %i to %s", (status, kind) => {
    expect(getApiErrorKind(axiosError({ status }))).toBe(kind);
  });

  test("distinguishes timeout from a generic network failure", () => {
    setOnline(true);
    const timeout = axiosError({ code: "ECONNABORTED", message: "timeout of 30000ms exceeded" });
    const network = axiosError({ message: "Network Error" });

    expect(getApiErrorKind(timeout)).toBe(API_ERROR_KIND.TIMEOUT);
    expect(getApiErrorKind(network)).toBe(API_ERROR_KIND.NETWORK);
    expect(isConnectivityError(timeout)).toBe(true);
    expect(isConnectivityError(network)).toBe(true);
  });

  test("distinguishes browser-offline from server/network unreachability", () => {
    setOnline(false);
    const error = axiosError({ message: "Network Error" });

    expect(getApiErrorKind(error)).toBe(API_ERROR_KIND.OFFLINE);
    expect(getApiErrorPresentation(error)).toEqual(expect.objectContaining({
      title: "You're offline",
      retryable: true,
    }));
  });

  test("refresh timeout sentinel is connectivity failure and never auth expiry", () => {
    setOnline(true);
    const error = new Error("REFRESH_TIMEOUT");

    expect(getApiErrorKind(error)).toBe(API_ERROR_KIND.TIMEOUT);
    expect(isConnectivityError(error)).toBe(true);
    expect(getApiErrorKind(error)).not.toBe(API_ERROR_KIND.AUTH);
  });

  test("session-expired 403 remains auth rather than permission denial", () => {
    const error = axiosError({
      status: 403,
      data: { code: "SESSION_EXPIRED", message: "Session expired" },
    });

    expect(getApiErrorKind(error)).toBe(API_ERROR_KIND.AUTH);
    expect(isConnectivityError(error)).toBe(false);
  });
});
