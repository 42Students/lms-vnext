/**
 * Student V1 §5 "Off-campus offer": "I got an offer outside campus" with the letter -> the
 * placement cell verifies. This proves the letter-upload field appears for the EXTERNAL_OFFER
 * request type and its URL rides along in the request payload.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlacementCellContent from "@/components/Placements/PlacementCellContent";
import { getPlacementOverview, raiseStudentRequest } from "@/api/Services/TpoHubService";
import { uploadFileViaPresign } from "@/utils/uploadToR2";

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
  registration: { registrationOpen: false }, offers: [], schedule: [], requests: [], debarments: [], notices: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  getPlacementOverview.mockResolvedValue({ data: overview });
});

test("uploads the offer letter and sends its URL with the EXTERNAL_OFFER request", async () => {
  uploadFileViaPresign.mockResolvedValue({ publicUrl: "https://r2.example/offer-letter.pdf" });
  raiseStudentRequest.mockResolvedValue({ data: { status: "success" } });

  render(<PlacementCellContent />);
  fireEvent.click(await screen.findByRole("button", { name: "New request" }));

  const typeSelect = screen.getByLabelText("What do you need?");
  fireEvent.mouseDown(typeSelect);
  fireEvent.click(await screen.findByText("Report an off-campus offer"));

  fireEvent.change(await screen.findByPlaceholderText("e.g. Acme Corp"), { target: { value: "Beta Industries" } });
  fireEvent.change(screen.getByPlaceholderText("e.g. 8.5"), { target: { value: "8.5" } });

  const fileInput = await screen.findByLabelText(/Offer letter/i, { selector: "input" }).catch(() => document.querySelector('input[type="file"]'));
  fireEvent.change(fileInput, { target: { files: [new File(["x"], "offer.pdf", { type: "application/pdf" })] } });
  await waitFor(() => expect(uploadFileViaPresign).toHaveBeenCalled());
  await screen.findByText(/Attached: offer.pdf/);

  fireEvent.change(screen.getByLabelText("Tell the placement cell why"), { target: { value: "Got an offer from a company I applied to directly" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));

  await waitFor(() => expect(raiseStudentRequest).toHaveBeenCalledWith({
    type: "EXTERNAL_OFFER", jobId: null,
    reason: "Got an offer from a company I applied to directly",
    payload: { companyName: "Beta Industries", ctcLpa: 8.5, letterUrl: "https://r2.example/offer-letter.pdf" },
  }));
}, 15000);
