/**
 * UI/UX audit follow-up (SHELL-12): the topbar's +New menu is scoped to the company you're
 * already looking at instead of always showing the same generic RecruiterLead/Drive/Follow-up - one click
 * closer, prefilled, and only when there's actually a company in view (every other page keeps the
 * full menu).
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import TpoTopBar from "@/components/tpo/TpoTopBar";
import { getBell, getThreads } from "@/api/Services/TpoHubService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getBell: jest.fn(), getThreads: jest.fn(), globalSearch: jest.fn(), getCounts: jest.fn().mockRejectedValue({ response: { status: 404 } }) }));
jest.mock("@/api/Services/TpoService", () => ({ addFollowUp: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  getBell.mockResolvedValue({ data: { status: "success", data: [] } });
  getThreads.mockResolvedValue({ data: { status: "success", data: [] } });
});

test("on a company page, +New offers company-scoped actions", async () => {
  useRouter.mockReturnValue({ push: mockPush, pathname: "/tpo/companies", query: { name: "Acme" } });
  render(<TpoTopBar />);
  fireEvent.click(screen.getByRole("button", { name: /New/i }));
  expect(await screen.findByText("New recruiter lead for Acme")).toBeInTheDocument();
  expect(screen.getByText("New drive for Acme")).toBeInTheDocument();

  fireEvent.click(screen.getByText("New recruiter lead for Acme"));
  expect(mockPush).toHaveBeenCalledWith("/tpo/recruiters?add=1&company=Acme");
});

test("everywhere else, +New keeps the full generic menu", async () => {
  useRouter.mockReturnValue({ push: mockPush, pathname: "/tpo/home", query: {} });
  render(<TpoTopBar />);
  fireEvent.click(screen.getByRole("button", { name: /New/i }));
  expect(await screen.findByText("Recruiter lead")).toBeInTheDocument();
  expect(screen.getByText("Drive")).toBeInTheDocument();
  expect(screen.getByText("Follow-up")).toBeInTheDocument();
  expect(screen.queryByText(/New recruiter lead for/)).not.toBeInTheDocument();
});
