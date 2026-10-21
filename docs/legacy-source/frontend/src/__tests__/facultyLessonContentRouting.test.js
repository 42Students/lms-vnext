import Api from "@/api/ApiMethod";

jest.mock("@/utils/authUtils", () => ({
  getAccessToken: jest.fn(() => null),
  refreshAccessToken: jest.fn(),
  handleSessionExpired: jest.fn(),
  SESSION_EXPIRED_MESSAGE: "Session expired",
  SESSION_EXPIRED_REDIRECT_GUARD_KEY: "expired",
}));

const runRequestInterceptor = (config) => {
  const interceptor = Api.interceptors.request.handlers.find((handler) => typeof handler.fulfilled === "function");
  return interceptor.fulfilled({ headers: {}, ...config });
};

describe("faculty lesson content authoring route", () => {
  it("reroutes the legacy lesson-content POST to the assignment-checked backend endpoint", () => {
    const request = runRequestInterceptor({ method: "post", url: "/api/v1/lesson/contents/create" });
    expect(request.url).toBe("/api/v1/faculty/lesson-contents/create");
  });

  it("also supports the original relative URL without a leading slash", () => {
    const request = runRequestInterceptor({ method: "POST", url: "api/v1/lesson/contents/create" });
    expect(request.url).toBe("/api/v1/faculty/lesson-contents/create");
  });

  it("never reroutes lesson mutations, reads or unrelated POST requests", () => {
    expect(runRequestInterceptor({ method: "put", url: "/api/v1/lesson/contents/create" }).url)
      .toBe("/api/v1/lesson/contents/create");
    expect(runRequestInterceptor({ method: "post", url: "/api/v1/lesson/contents/update" }).url)
      .toBe("/api/v1/lesson/contents/update");
    expect(runRequestInterceptor({ method: "post", url: "/api/v1/lesson/create" }).url)
      .toBe("/api/v1/lesson/create");
  });
});
