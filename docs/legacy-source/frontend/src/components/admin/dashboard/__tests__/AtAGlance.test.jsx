import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AtAGlance from "../AtAGlance";
import { getAdminCollegeSummary } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  getAdminCollegeSummary: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("summary load failure stays visible and can be retried", async () => {
  getAdminCollegeSummary
    .mockRejectedValueOnce(new Error("down"))
    .mockResolvedValueOnce({
      data: { data: { studentCount: 12, facultyCount: 3, courseCount: 5, activeDriveCount: 1 } },
    });

  render(<AtAGlance collegeId={7} />);

  expect(await screen.findByText("Couldn't load college summary")).toBeInTheDocument();
  expect(screen.getByText("The rest of the dashboard is still available.")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /retry/i }));

  await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
  expect(screen.getByText("Students")).toBeInTheDocument();
  expect(getAdminCollegeSummary).toHaveBeenCalledTimes(2);
});

test("changing college scope does not show the previous college's figures under the new scope", async () => {
  let resolveSecond;
  getAdminCollegeSummary
    .mockResolvedValueOnce({
      data: { data: { studentCount: 99, facultyCount: 9, courseCount: 8, activeDriveCount: 7 } },
    })
    .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

  const view = render(<AtAGlance collegeId={1} />);
  expect(await screen.findByText("99")).toBeInTheDocument();

  view.rerender(<AtAGlance collegeId={2} />);

  expect(screen.queryByText("99")).not.toBeInTheDocument();

  resolveSecond({
    data: { data: { studentCount: 22, facultyCount: 2, courseCount: 4, activeDriveCount: 0 } },
  });
  expect(await screen.findByText("22")).toBeInTheDocument();
});
