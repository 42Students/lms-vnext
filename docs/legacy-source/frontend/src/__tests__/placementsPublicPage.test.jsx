/** Step 16 (D2): the college's public placements page and its settings. */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlacementsPageSettings from "@/components/tpo/settings/PlacementsPageSettings";
import PlacementsPublicPage from "@/pages/placements/index";
import { getPlacementsPage, savePlacementsPage } from "@/api/Services/TpoHubService";
import { getPublicPlacementsPage, recruitFromCollege, sendRecruitCode } from "@/api/Services/TpoService";

jest.setTimeout(30000);
jest.mock("@/api/Services/TpoHubService", () => ({ getPlacementsPage: jest.fn(), savePlacementsPage: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ getPublicPlacementsPage: jest.fn(), sendRecruitCode: jest.fn(), recruitFromCollege: jest.fn() }));
const ok = (data) => Promise.resolve({ data: { status: "success", data } });
const available = [{ value: "STUDENTS", label: "Students in placements" }, { value: "MEDIAN_CTC", label: "Median CTC" }];

beforeEach(() => jest.clearAllMocks());

test("the placement cell switches the page on and sees which numbers lack data", async () => {
  getPlacementsPage.mockReturnValue(ok({ enabled: false, about: "", numbers: ["STUDENTS"], available, preview: [{ key: "STUDENTS", label: "Students in placements", value: 120 }] }));
  savePlacementsPage.mockReturnValue(ok({ enabled: true, about: "", numbers: ["STUDENTS"], available, preview: [] }));
  render(<PlacementsPageSettings />);
  expect(await screen.findByText("Median CTC (not enough data yet)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "Placements page is on" }));
  await waitFor(() => expect(savePlacementsPage).toHaveBeenCalledWith({ enabled: true }));
});

test("a company reads the page and asks to recruit with a proven email", async () => {
  getPublicPlacementsPage.mockResolvedValue({ data: { collegeName: "NSRIT", about: "Engineering college in Vizag.", numbers: [{ key: "STUDENTS", label: "Students in placements", value: 120 }] } });
  sendRecruitCode.mockResolvedValue({ data: { status: "CODE_SENT", email: "kumar@omega.com" } });
  recruitFromCollege.mockResolvedValue({ data: { status: "RECEIVED" } });
  render(<PlacementsPublicPage />);
  expect(await screen.findByText("Placements at NSRIT")).toBeInTheDocument();
  expect(screen.getByText("Students in placements")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "kumar@omega.com" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Kumar" } });
  fireEvent.click(screen.getByRole("button", { name: "Send me a code" }));
  fireEvent.change(await screen.findByLabelText("Code sent to kumar@omega.com"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Send to the placement cell" }));
  await waitFor(() => expect(recruitFromCollege).toHaveBeenCalledWith(expect.objectContaining({ email: "kumar@omega.com", name: "Kumar", code: "123456" })));
  expect(await screen.findByText("Thank you")).toBeInTheDocument();
});

test("a page the college has not published says so", async () => {
  getPublicPlacementsPage.mockRejectedValue({ response: { status: 404 } });
  render(<PlacementsPublicPage />);
  expect(await screen.findByText("This page isn't available")).toBeInTheDocument();
});
