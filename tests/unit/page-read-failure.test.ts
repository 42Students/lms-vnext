import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/modules/permissions/policy";
import { logError } from "@/observability/logger";
import { reportPageReadFailure } from "@/observability/page-read-failure";

vi.mock("@/observability/logger", () => ({
  logError: vi.fn(),
}));

const logErrorMock = vi.mocked(logError);

beforeEach(() => vi.clearAllMocks());

describe("recoverable page-read failure reporting", () => {
  it("records the failing reader under a static route template", () => {
    const error = new Error("database connection failed");
    reportPageReadFailure({
      event: "college.drive_settings_read_failed",
      route: "/college/placements/jobs/[jobId]/settings",
      stage: "eligibility_policy",
    }, error);

    expect(logErrorMock).toHaveBeenCalledExactlyOnceWith(
      "college.drive_settings_read_failed",
      error,
      {
        component: "page",
        route: "/college/placements/jobs/[jobId]/settings",
        stage: "eligibility_policy",
      },
    );
  });

  it("does not disguise an authorization denial as a loading failure", () => {
    const denial = new AuthorizationError("placements.manage");
    expect(() => reportPageReadFailure({
      event: "college.drive_settings_read_failed",
      route: "/college/placements/jobs/[jobId]/settings",
      stage: "company_choices",
    }, denial)).toThrow(denial);
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it("identifies independent report and funnel read failures separately", () => {
    reportPageReadFailure({
      event: "college.hiring_report_failed",
      route: "/college/hiring-dashboard",
      stage: "report_workspace",
    }, new Error("report unavailable"));
    reportPageReadFailure({
      event: "college.hiring_funnel_failed",
      route: "/college/hiring-dashboard",
      stage: "hiring_funnel",
    }, new Error("funnel unavailable"));

    expect(logErrorMock).toHaveBeenCalledTimes(2);
    expect(logErrorMock.mock.calls[0]?.[2]).toEqual({
      component: "page", route: "/college/hiring-dashboard", stage: "report_workspace",
    });
    expect(logErrorMock.mock.calls[1]?.[2]).toEqual({
      component: "page", route: "/college/hiring-dashboard", stage: "hiring_funnel",
    });
  });

  it("reports non-Error rejections without interpolating request data into metadata", () => {
    reportPageReadFailure({
      event: "college.drive_settings_read_failed",
      route: "/college/placements/jobs/[jobId]/settings",
      stage: "cohorts",
    }, "query failed");
    expect(logErrorMock).toHaveBeenCalledWith(
      "college.drive_settings_read_failed",
      "query failed",
      {
        component: "page",
        route: "/college/placements/jobs/[jobId]/settings",
        stage: "cohorts",
      },
    );
  });
});
