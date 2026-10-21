import Api from "@/api/ApiMethod";
import {
  handleSessionExpired,
  refreshAccessToken,
} from "@/utils/authUtils";
import {
  reportApiFailure,
  reportAuthFailureMidAction,
} from "@/utils/clientErrorReporting";
import { notification } from "antd";

jest.mock("@/utils/authUtils", () => ({
  getAccessToken: jest.fn(() => null),
  refreshAccessToken: jest.fn(),
  handleSessionExpired: jest.fn(() => "/"),
  SESSION_EXPIRED_MESSAGE: "Session expired",
  SESSION_EXPIRED_REDIRECT_GUARD_KEY: "redirect-once",
}));

jest.mock("@/utils/clientErrorReporting", () => ({
  reportApiFailure: jest.fn(),
  reportAuthFailureMidAction: jest.fn(),
}));

jest.mock("@/config/roles", () => ({
  isApiAllowedForRecruiter: jest.fn(() => true),
  isRecruiterType: jest.fn(() => false),
}));

jest.mock("antd", () => ({
  message: { warning: jest.fn(), error: jest.fn() },
  notification: { warning: jest.fn(), error: jest.fn(), destroy: jest.fn() },
}));

const rejectStatus = (status, data = {}) => (config) =>
  Promise.reject({ config, response: { status, data, config } });

beforeEach(() => {
  jest.clearAllMocks();
});

test.each([
  [404, "not_found"],
  [409, "conflict"],
  [422, "validation"],
])("HTTP %i rejects with normalized inline error semantics", async (status, kind) => {
  let caught;
  try {
    await Api.get("/api/v1/example", { adapter: rejectStatus(status, { message: "raw backend text" }) });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeTruthy();
  expect(caught.lmsKind).toBe(kind);
  expect(caught.lmsPresentation).toEqual(expect.objectContaining({ kind }));
  expect(reportApiFailure).toHaveBeenCalledWith(expect.objectContaining({ statusCode: status }));
});

test("a refresh timeout after 401 keeps the session out of the expiry flow", async () => {
  refreshAccessToken.mockRejectedValueOnce(new Error("REFRESH_TIMEOUT"));

  await expect(
    Api.get("/api/v1/protected", { adapter: rejectStatus(401, { error: "Unauthorized" }) })
  ).rejects.toThrow("REFRESH_TIMEOUT");

  expect(handleSessionExpired).not.toHaveBeenCalled();
  expect(reportAuthFailureMidAction).not.toHaveBeenCalled();
  expect(notification.warning).toHaveBeenCalledWith(expect.objectContaining({
    message: "Request timed out",
    key: "lms-network-error",
  }));
});

test("a genuinely failed refresh still expires the session", async () => {
  refreshAccessToken.mockRejectedValueOnce(new Error("REFRESH_FAILED"));

  await expect(
    Api.get("/api/v1/protected", { adapter: rejectStatus(401, { error: "Unauthorized" }) })
  ).rejects.toThrow("REFRESH_FAILED");

  expect(reportAuthFailureMidAction).toHaveBeenCalled();
  expect(handleSessionExpired).toHaveBeenCalled();
});
