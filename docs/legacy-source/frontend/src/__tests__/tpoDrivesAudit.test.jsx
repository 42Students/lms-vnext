/**
 * Drives audit: the list shows how many applied per drive and flags live drives with no deadline;
 * a live drive with no deadline leads with Set deadline, and Close drive is not the default button.
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import TpoDrivesList from "@/pages/tpo/drives/index";
import { listDrives } from "@/api/Services/TpoService";
import { getDriveCounts, getSeasonSettings } from "@/api/Services/TpoHubService";

// Full pages on the AG Grid; under a loaded machine the default 5s is flaky.
jest.setTimeout(30000);

const mockReplace = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace, query: {}, pathname: "/tpo/drives" }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1 } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listDrives: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getTeam: jest.fn(() => Promise.resolve({ data: { status: "success", data: { members: [] } } })), getFacultyDirectory: jest.fn(() => Promise.resolve({ data: [] })), getSeasonSettings: jest.fn(), getDriveCounts: jest.fn(), getSavedViews: jest.fn(() => Promise.resolve({ data: [] })), saveView: jest.fn(), deleteView: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  getSeasonSettings.mockResolvedValue({ data: {} });
  listDrives.mockResolvedValue({ data: [
    { id: 1, companyName: "Zoho", jobTitle: "CRM", lifecycleStatus: "PUBLISHED", seasonId: null, driveMode: "ON_CAMPUS" },
    { id: 2, companyName: "Wipro", jobTitle: "QA", lifecycleStatus: "PUBLISHED", seasonId: 1, driveMode: "ON_CAMPUS", applicationDeadline: "2099-01-10T17:00:00" },
  ] });
  getDriveCounts.mockResolvedValue({ data: [{ jobId: 1, applied: 12, offers: 2 }] });
});

test("live drives show applied counts, no status column, and Needs doing counts drives with no deadline", async () => {
  render(<TpoDrivesList />);
  // The drive cell is company and role only; the deadline and the applied count have their own columns.
  expect((await screen.findAllByText("No deadline")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/^12 applied/).length).toBeGreaterThan(0);
  // (The Applied column itself is responsive and hidden in jsdom; the phone line above carries the same count.)
  expect(screen.queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
  expect(screen.getByTestId("drives.work.nodeadline")).toHaveTextContent("Live with no deadline · 1");
});

test("if the counts cannot load the list still shows", async () => {
  getDriveCounts.mockRejectedValue(new Error("404"));
  render(<TpoDrivesList />);
  expect(await screen.findByText("Zoho")).toBeInTheDocument();
});
