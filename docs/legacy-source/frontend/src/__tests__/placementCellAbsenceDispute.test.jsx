/**
 * Student V1 §7 "Marked absent": a one-tap dispute straight from the notice — the New Request
 * modal opens pre-filled with type ABSENCE_DISPUTE and a reason referencing the notice, instead
 * of making the student find it themselves in the type dropdown.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import PlacementCellContent from "@/components/Placements/PlacementCellContent";
import { getPlacementOverview, raiseStudentRequest } from "@/api/Services/TpoHubService";

const mockRouter = { push: jest.fn() };
const mockSession = { id: 42 };

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useSelector: (selector) => selector({ loginUser: mockSession }) }));
jest.mock("@/api/Services/TpoHubService", () => ({
  getPlacementOverview: jest.fn(), registerForPlacements: jest.fn(), raiseStudentRequest: jest.fn(),
  confirmMyRound: jest.fn(), requestRoundReschedule: jest.fn(), respondToTpoOffer: jest.fn(), getDriveEligibility: jest.fn(() => Promise.resolve({ data: null })), getPlacementJourney: jest.fn(() => Promise.resolve({ data: { applications: [], schedule: [], offers: [] } })), getDriveProcess: jest.fn(() => Promise.resolve({ data: [] })), getPlacementRules: jest.fn(() => Promise.resolve({ data: { points: [{ title: "Offers you can hold", text: "One offer at a time." }] } })), getApplyChecks: jest.fn(() => Promise.resolve({ data: {} })) }));
jest.mock("@/api/Services/jobService", () => ({ previewOfferAccept: jest.fn() }));
jest.mock("@/utils/uploadToR2", () => ({ uploadFileViaPresign: jest.fn() }));

const overview = {
  registration: { registrationOpen: false }, offers: [], schedule: [], requests: [], debarments: [],
  notices: [{ id: 1, event: "MARKED_ABSENT", title: "You were marked absent", body: "You were marked absent for Infosys Aptitude.", createdAt: "2026-10-05T00:00:00Z" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  getPlacementOverview.mockResolvedValue({ data: overview });
});

test("the dispute button opens New Request pre-filled with ABSENCE_DISPUTE and a reason", async () => {
  raiseStudentRequest.mockResolvedValue({ data: { status: "success" } });
  render(<PlacementCellContent />);

  fireEvent.click(await screen.findByRole("button", { name: /Wrong\? Tell the placement cell/i }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Absence dispute")).toBeInTheDocument();
  expect(screen.getByLabelText("Tell the placement cell why")).toHaveValue(
    'Disputing: "You were marked absent for Infosys Aptitude."'
  );

  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(raiseStudentRequest).toHaveBeenCalledWith(expect.objectContaining({ type: "ABSENCE_DISPUTE" })));
}, 15000);
