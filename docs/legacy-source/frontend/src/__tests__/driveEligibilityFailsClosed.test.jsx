import React from "react";
import { render, screen } from "@testing-library/react";
import DriveEligibilityPanel from "@/components/Placements/DriveEligibilityPanel";
import { getDriveEligibility } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ query: { jobId: "7" } }) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getDriveEligibility: jest.fn() }));

// BE-0012: a failed rules check is said; it is not shown as "no rules".
test("the panel says when the drive's rules couldn't be checked", async () => {
  getDriveEligibility.mockRejectedValueOnce(new Error("500"));
  render(<DriveEligibilityPanel jobId="7" />);
  expect(await screen.findByTestId("placements.eligibility-failed")).toHaveTextContent("couldn't check this drive's rules");
});

test("the panel lists the rules when they load", async () => {
  getDriveEligibility.mockResolvedValueOnce({ data: { eligible: false, checks: [{ rule: "CGPA", pass: false, detail: "Needs 7.0" }] } });
  render(<DriveEligibilityPanel jobId="7" />);
  expect(await screen.findByText(/Needs 7\.0/)).toBeInTheDocument();
  expect(screen.getByText("CGPA")).toBeInTheDocument();
});

test("a met rule says it is met, not \"Eligible\" twice; the placement cell's wording is turned to the student", async () => {
  getDriveEligibility.mockResolvedValueOnce({ data: { eligible: false, checks: [
    { rule: "Branch", pass: true, detail: "Eligible" }, { rule: "Batch", pass: false, detail: "Their batch has finished placements" }] } });
  render(<DriveEligibilityPanel jobId="7" />);
  expect(await screen.findByText(/yours is included/)).toBeInTheDocument();
  expect(screen.getByText(/Your batch has finished placements/)).toBeInTheDocument();
  expect(screen.queryByText(/Eligible/)).not.toBeInTheDocument();
});
