/**
 * UI/UX audit, buy-signal extra "Compliance Preflight for NAAC/NIRF export" (2026-10-01): the
 * accreditation export used to be a one-click download with no completeness check at all.
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Modal } from "antd";
import { useRouter } from "next/router";
import TpoReport from "@/pages/tpo/reports/[name]";
import { getReport } from "@/api/Services/TpoHubService";
import { downloadCsv } from "@/components/tpo/tpoFiles";

// Full pages on the AG Grid; under a loaded machine the default 5s is flaky.
jest.setTimeout(30000);

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getReport: jest.fn() }));
jest.mock("@/components/tpo/tpoFiles", () => ({ downloadCsv: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ query: { name: "accreditation" }, push: jest.fn() });
});

// A static Modal.confirm lives outside the render container and lingers through its close animation;
// on a slow CI machine it was still in the page when the next test looked for "no dialog".
afterEach(() => {
  Modal.destroyAll();
  document.body.innerHTML = "";
});

test("incomplete rows require confirmation before exporting, and name the missing fields", async () => {
  getReport.mockResolvedValue({ data: { status: "success", data: { rows: [
    { studentName: "Asha", rollNumber: "R001", programme: "CSE", batch: "2026", employer: "Acme", employerContact: null, packageLpa: 8, offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
    { studentName: "Bala", rollNumber: "R002", programme: "CSE", batch: "2026", employer: "Acme", employerContact: "hr@acme.com", packageLpa: 8, offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
  ] } } });
  render(<TpoReport />);
  await screen.findByText("Asha");
  fireEvent.click(screen.getByText("Export CSV for NAAC / NIRF"));

  const dialog = await screen.findByRole("dialog", {}, { timeout: 5000 });
  expect(within(dialog).getByText("1 of 2 students are missing data NAAC/NIRF ask for")).toBeInTheDocument();
  expect(within(dialog).getByText("Employer contact: missing for 1")).toBeInTheDocument();
  expect(downloadCsv).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole("button", { name: "Export anyway" }));
  expect(downloadCsv).toHaveBeenCalledTimes(1);
});

test("fully complete rows export with no confirmation at all", async () => {
  getReport.mockResolvedValue({ data: { status: "success", data: { rows: [
    { studentName: "Asha", rollNumber: "R001", programme: "CSE", batch: "2026", employer: "Acme", employerContact: "hr@acme.com", packageLpa: 8, offerStatus: "ACCEPTED", joiningStatus: "JOINED" },
  ] } } });
  render(<TpoReport />);
  await screen.findByText("Asha");
  fireEvent.click(screen.getByText("Export CSV for NAAC / NIRF"));
  expect(downloadCsv).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("other reports have one export, the table's own, with no compliance gate", async () => {
  useRouter.mockReturnValue({ query: { name: "by-company" }, push: jest.fn() });
  getReport.mockResolvedValue({ data: { status: "success", data: { rows: [{ company: "Asha Infotech", drives: 1, applied: 3, placed: 0, offers: 0, avgCtc: null, maxCtc: null }] } } });
  render(<TpoReport />);
  // The company shows in both the chart and the table.
  expect((await screen.findAllByText("Asha Infotech")).length).toBeGreaterThan(0);
  expect(screen.queryByText("Export CSV for NAAC / NIRF")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^download Export$/ })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
