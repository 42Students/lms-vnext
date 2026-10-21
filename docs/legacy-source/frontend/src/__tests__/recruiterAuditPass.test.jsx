/** recruiter audit pass: first-drive start, branch and year limits on a request, readable shared columns. */
import React from "react";
import { render, screen } from "@testing-library/react";
import RecruiterToday from "@/components/recruiter/RecruiterToday";
import { buildDriveForm, valuesFromRequest } from "@/pages/recruiter/drives/new";
import { columnLabel } from "@/components/recruiter/recruiterReviewUtils";
import { getRecruiterToday, listMyDrives } from "@/api/Services/RecruiterService";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: {}, pathname: "/recruiter/home" }) }));
jest.mock("@/api/Services/RecruiterService", () => ({ getRecruiterToday: jest.fn(), listMyDrives: jest.fn() }));

test("a recruiter with no drive yet is shown how to start, not 'all caught up'", async () => {
  getRecruiterToday.mockResolvedValue({ data: { tasks: [], thisWeek: [], liveDrive: null } });
  listMyDrives.mockResolvedValue({ data: [] });
  render(<RecruiterToday collegeId={6} firstName="Asha" companyName="Acme" />);
  expect(await screen.findByTestId("recruiter.today.first")).toHaveTextContent("Start with your first drive");
  expect(screen.queryByText("You are all caught up")).not.toBeInTheDocument();
  expect(screen.getByText("Nothing scheduled in the next 7 days.")).toBeInTheDocument();
});

test("branches and passing years go out with the request and come back for Hire again", () => {
  const body = buildDriveForm({ jobTitle: "Analyst", ctcLpa: 6, branches: [" CSE ", "ECE"], passingYears: ["2027", "bad"] }, []);
  expect(body.eligibility.branches).toEqual(["CSE", "ECE"]);
  expect(body.eligibility.passingYears).toEqual([2027]);
  expect(buildDriveForm({ jobTitle: "Analyst", ctcLpa: 6, branches: [] }, []).eligibility.branches).toBeUndefined();
  expect(valuesFromRequest({ roleTitle: "Analyst", branches: ["CSE"], passingYears: [2027] })).toMatchObject({ branches: ["CSE"], passingYears: ["2027"] });
});

test("shared columns read as headings, not raw keys", () => {
  expect(columnLabel("cgpa")).toBe("UG %");
  expect(columnLabel("roll")).toBe("Roll no.");
  expect(columnLabel("github")).toBe("GitHub");
  expect(columnLabel("tenthPct")).toBe("Tenth Pct");
});
