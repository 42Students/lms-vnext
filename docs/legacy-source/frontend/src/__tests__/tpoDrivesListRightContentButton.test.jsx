/**
 * UI/UX brutal-audit follow-up: proves a real, previously-affected page now actually renders its
 * header action button. tpo/drives/index.js's "Create drive" button was invisible because the
 * page passed `extra` to ListingPageHeader, which only ever renders `rightContent`.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import TpoDrivesList from "@/pages/tpo/drives/index";
import { listDrives } from "@/api/Services/TpoService";
import { getSeasonSettings } from "@/api/Services/TpoHubService";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, query: {}, pathname: "/tpo/drives", replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (pick) => pick({ loginUser: { id: 1 } }) }));
jest.mock("@/api/Services/TpoService", () => ({ listDrives: jest.fn() }));
jest.mock("@/api/Services/TpoHubService", () => ({ getTeam: jest.fn(() => Promise.resolve({ data: { status: "success", data: { members: [] } } })), getFacultyDirectory: jest.fn(() => Promise.resolve({ data: [] })), getSeasonSettings: jest.fn(), getDriveCounts: jest.fn(() => Promise.resolve({ data: [] })), getSavedViews: jest.fn(), saveView: jest.fn(), deleteView: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(async (p) => {
    const res = await p;
    return { success: res?.data?.status === "success", data: res?.data?.data ?? res?.data };
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  listDrives.mockResolvedValue({ data: { status: "success", data: [] } });
  getSeasonSettings.mockResolvedValue({ data: [] });
});

test("the Create drive button actually renders (rightContent, not the silently-dropped extra)", async () => {
  render(<TpoDrivesList />);
  const button = await screen.findByRole("button", { name: /Create drive/i });
  expect(button).toBeInTheDocument();
});
