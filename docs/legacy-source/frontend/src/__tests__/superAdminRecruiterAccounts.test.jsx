/**
 * Super admin, Recruiter accounts (was "HR Accounts" before the HR -> recruiter rename, docs/naming in the backend): the list loads from
 * /api/v1/superadmin/recruiters, the page says recruiter everywhere, and a name opens that recruiter's account with their colleges.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterAccounts from "@/pages/superadmin/sections/RecruiterAccounts";
import { getRecruiterAccount, listRecruiterAccounts } from "@/api/Services/SuperAdminRecruiterService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(async (p) => ({ success: true, data: (await p)?.data })),
  getColleges: jest.fn(() => Promise.resolve({ data: [{ id: 6, name: "NSRIT" }] })),
}));
jest.mock("@/api/Services/SuperAdminRecruiterService", () => ({
  createRecruiterAccount: jest.fn(), deleteRecruiterAccount: jest.fn(), getRecruiterAccount: jest.fn(), grantRecruiterCollege: jest.fn(),
  listRecruiterAccounts: jest.fn(), reactivateRecruiterAccount: jest.fn(), revokeRecruiterCollege: jest.fn(), revokeRecruiterSessions: jest.fn(),
  suspendRecruiterAccount: jest.fn(), updateRecruiterAccount: jest.fn(), listIndustryCompanies: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
  listRecruiterAccounts.mockResolvedValue({ data: { items: [{ id: 1, firstName: "Ravi", lastName: "Kumar", contactMobile: "9100060092", companyName: "Test Industry Co", activeCollegeCount: 1, status: "ACTIVE" }], total: 1 } });
  getRecruiterAccount.mockResolvedValue({ data: { id: 1, firstName: "Ravi", lastName: "Kumar", contactMobile: "9100060092", status: "ACTIVE",
    colleges: [{ collegeId: 6, collegeName: "NSRIT", status: "ACTIVE", validUntil: "2027-04-04T10:00:00" }] } });
});

test("the list says recruiter, loads the accounts, and a name opens the account", async () => {
  render(<RecruiterAccounts />);
  expect(await screen.findByText("Ravi Kumar")).toBeInTheDocument();
  expect(screen.getByText("Recruiter accounts")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Add recruiter/ })).toBeInTheDocument();
  expect(screen.queryByText(/\bHR\b/)).not.toBeInTheDocument();
  expect(listRecruiterAccounts).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Ravi Kumar" }));
  await waitFor(() => expect(getRecruiterAccount).toHaveBeenCalledWith(1));
  expect((await screen.findAllByText(/NSRIT/)).length).toBeGreaterThan(0);
});
