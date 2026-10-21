import Api from "@/api/ApiMethod";

jest.mock("@/utils/authUtils", () => ({
  getAccessToken: jest.fn(() => null),
  refreshAccessToken: jest.fn(),
  handleSessionExpired: jest.fn(() => "/login"),
  SESSION_EXPIRED_MESSAGE: "Session expired",
  SESSION_EXPIRED_REDIRECT_GUARD_KEY: "redirect-once",
}));
jest.mock("antd", () => ({
  message: { warning: jest.fn(), error: jest.fn() },
  notification: { error: jest.fn(), destroy: jest.fn() },
}));

const forbidden = (config) => Promise.reject({
  config,
  response: { status: 403, data: { error: "FORBIDDEN" }, config },
});

describe("course API: deterministic authorization denial", () => {
  it("never repeats a forbidden GET", async () => {
    let requests = 0;
    await expect(Api.get("/api/v1/student-courses/byStudent/42", {
      adapter: (config) => { requests += 1; return forbidden(config); },
    })).rejects.toMatchObject({ response: { status: 403 } });
    expect(requests).toBe(1);
  });

  it("never replays a forbidden assignment mutation", async () => {
    let requests = 0;
    await expect(Api.put("/api/v1/teaching-assignment/update/42", { role: "PRIMARY" }, {
      adapter: (config) => { requests += 1; return forbidden(config); },
    })).rejects.toMatchObject({ response: { status: 403 } });
    expect(requests).toBe(1);
  });
});
