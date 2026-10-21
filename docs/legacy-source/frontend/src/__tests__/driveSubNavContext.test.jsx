import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";

const mockRouter = {
  query: {},
  push: jest.fn(),
};

jest.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.query = {};
});

describe("drive sub-navigation return context", () => {
  test("breadcrumb and tab changes preserve the originating filtered list", () => {
    mockRouter.query = {
      returnTo: "/college-admin/jobs?q=acme&status=active",
    };

    render(
      <DriveSubNav
        jobId={42}
        active="overview"
        basePath="/college-admin"
      />
    );

    expect(screen.getByRole("link", { name: "Drives" }))
      .toHaveAttribute("href", "/college-admin/jobs?q=acme&status=active");

    fireEvent.click(screen.getByRole("tab", { name: "Applications" }));
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/college-admin/jobs/42/applications?returnTo=%2Fcollege-admin%2Fjobs%3Fq%3Dacme%26status%3Dactive"
    );
  });

  test("rejects a return target outside the current admin jobs workspace", () => {
    mockRouter.query = { returnTo: "//evil.example/redirect" };

    render(
      <DriveSubNav
        jobId={42}
        active="overview"
        basePath="/college-admin"
      />
    );

    expect(screen.getByRole("link", { name: "Drives" }))
      .toHaveAttribute("href", "/college-admin/jobs");
  });
});
