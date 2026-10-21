/**
 * Drive page, Applicants: the journey strip (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md) replaced the Overview funnel chips that
 * opened this tab pre-filtered. Steps nest (an offered applicant was also interviewed), the gaps between them are the work, and
 * picking one narrows the list; picking it again shows everyone.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ApplicantsTab from "@/components/tpo/drive/ApplicantsTab";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, pathname: "/tpo/drives/901", replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn().mockResolvedValue({ success: true, data: [] }) }));
jest.mock("@/api/Services/TpoService", () => ({
  applyOnBehalf: jest.fn(), bulkMoveApplicants: jest.fn(), bulkRejectApplicants: jest.fn(), remindNotApplied: jest.fn(), undoBulkAction: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({ bulkNudge: jest.fn(), bulkNote: jest.fn(), getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn() }));

jest.setTimeout(30000);

const job = { id: 901, companyName: "Acme" };
const applicants = [
  { applicationId: 1, learnerId: 1, firstName: "Asha", rollNumber: "R001", branch: "CSE", stage: "INTERVIEW" },
  { applicationId: 2, learnerId: 2, firstName: "Bala", rollNumber: "R002", branch: "CSE", stage: "OFFERED" },
];
const tab = () => render(<ApplicantsTab job={job} applicants={applicants} notApplied={[]} reload={jest.fn()} onOpenStudent={jest.fn()} onShare={jest.fn()} />);

test("steps nest: an offered applicant was also interviewed", async () => {
  tab();
  expect(await screen.findByText("Asha")).toBeInTheDocument();
  expect(screen.getByTestId("djourney.D_INTERVIEW")).toHaveTextContent("2");
  expect(screen.getByTestId("djourney.D_OFFERED")).toHaveTextContent("1");
  expect(screen.getByTestId("djourney.D_GAP_DECISION")).toHaveTextContent("1");
});

test("a gap narrows the list to the work, and a second tap shows everyone again", async () => {
  tab();
  expect(await screen.findByText("Bala")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("djourney.D_GAP_DECISION")); // awaiting a decision: still at interview
  await waitFor(() => expect(screen.queryByText("Bala")).not.toBeInTheDocument());
  expect(screen.getByText("Asha")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("djourney.D_GAP_DECISION"));
  expect(await screen.findByText("Bala")).toBeInTheDocument();
});
