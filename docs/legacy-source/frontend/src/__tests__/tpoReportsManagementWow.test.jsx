import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import TpoReports from "@/pages/tpo/reports/index";
import TpoReport from "@/pages/tpo/reports/[name]";
import { getReport } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getReport: jest.fn() }));
jest.mock("@/components/tpo/tpoFiles", () => ({ downloadCsv: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

test("Reports landing shows the placement journey from placement-summary; each number opens its report", async () => {
  const push = jest.fn();
  useRouter.mockReturnValue({ query: {}, push });
  getReport.mockResolvedValue({ data: { status: "success", data: { stats: { registered: 1238, placedPct: 68, placedUnique: 842, offers: 1064, acceptedUnique: 790 }, rows: [] } } });
  render(<TpoReports />);
  expect(await screen.findByTestId("reports.journey.R_PLACED")).toHaveTextContent("842");
  expect(screen.getByTestId("reports.journey.R_ACCEPTED")).toHaveTextContent("790");
  expect(screen.getByTestId("reports.journey.R_UNPLACED")).toHaveTextContent("396");
  expect(screen.getByText(/1064 offers made/)).toBeInTheDocument();
  expect(screen.queryByText("Management review")).not.toBeInTheDocument();
  expect(getReport).toHaveBeenCalledWith("placement-summary", {});
  fireEvent.click(screen.getByTestId("reports.journey.R_UNPLACED"));
  expect(push).toHaveBeenCalledWith("/tpo/reports/unplaced");
});

test("a report says the college's numbers once, and Presentation view fills the screen", async () => {
  useRouter.mockReturnValue({ query: { name: "placement-summary" }, push: jest.fn() });
  getReport.mockResolvedValue({ data: { status: "success", data: {
    stats: { registered: 1238, placedPct: 68, placedUnique: 842, offers: 1064, acceptedUnique: 790 },
    rows: [{ branch: "CSE", placed: 420 }, { branch: "ECE", placed: 220 }],
  } } });
  const { container } = render(<TpoReport />);
  const context = await screen.findByTestId("report.context");
  expect(context).toHaveTextContent("842 students placed · 1064 offers · 68% placement rate · 790 accepted");
  expect(container.querySelector(".tpo-report-detail")).not.toHaveClass("tpo-report-detail--presentation");
  fireEvent.click(screen.getByRole("button", { name: /Presentation view/i }));
  expect(container.querySelector(".tpo-report-detail")).toHaveClass("tpo-report-detail--presentation");
  expect(screen.getByRole("button", { name: /Exit presentation/i })).toBeInTheDocument();
});

test("with nobody registered the placement rate says why instead of 0%", async () => {
  useRouter.mockReturnValue({ query: { name: "placement-summary" }, push: jest.fn() });
  getReport.mockResolvedValue({ data: { status: "success", data: { stats: { registered: 0, placedPct: 0, placedUnique: 0, offers: 0, acceptedUnique: 0 }, rows: [] } } });
  render(<TpoReport />);
  expect(await screen.findByTestId("report.context")).toHaveTextContent("no placement rate yet (nobody has registered)");
  expect(screen.queryByText("0%")).not.toBeInTheDocument();
});
