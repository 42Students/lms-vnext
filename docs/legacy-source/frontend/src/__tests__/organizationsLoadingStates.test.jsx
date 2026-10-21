import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Organizations from "@/pages/superadmin/sections/Organizations";
import { fetchWithErrorHandling, getOrganizations } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn((value) => value),
  getOrganizations: jest.fn(),
  createOrganization: jest.fn(),
  updateOrganization: jest.fn(),
  deleteOrganization: jest.fn(),
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation((value) => value);
});

test("shows a table-shaped skeleton on first organization load", async () => {
  const request = deferred();
  getOrganizations.mockReturnValue(request.promise);
  render(<Organizations />);
  expect(await screen.findByRole("status", { name: /loading organizations/i })).toBeInTheDocument();
  await act(async () => {
    request.resolve({ success: true, data: [{ id: 1, name: "Campus Group" }] });
    await request.promise;
  });
  expect(await screen.findByText("Campus Group")).toBeInTheDocument();
});

test("refresh failure keeps the last organization rows visible", async () => {
  getOrganizations.mockResolvedValueOnce({ success: true, data: [{ id: 1, name: "Campus Group" }] });
  render(<Organizations />);
  expect(await screen.findByText("Campus Group")).toBeInTheDocument();

  getOrganizations.mockResolvedValueOnce({ success: false, message: "temporary failure" });
  fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

  expect(screen.getByText("Campus Group")).toBeInTheDocument();
  expect(screen.getByText("Refreshing organizations…")).toBeInTheDocument();
  expect(await screen.findByText("Couldn't refresh organizations")).toBeInTheDocument();
  expect(screen.getByText("Campus Group")).toBeInTheDocument();
});
