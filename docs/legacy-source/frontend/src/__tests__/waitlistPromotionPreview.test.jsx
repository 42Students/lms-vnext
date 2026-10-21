/**
 * UI/UX audit, buy-signal extra "Waitlist Promotion Preview" (2026-10-01): "Offer to next
 * waitlisted" used to fire immediately and only explain itself afterward. It now shows exactly
 * who is next - and who ahead of them is skipped and why - before the TPO commits to freeing
 * the seat, using a read-only preview backed by the same ranking/skip logic as the real action.
 */
import React from "react";
import { configure, fireEvent, render, screen, within } from "@testing-library/react";
import { Modal } from "antd";
import OffersTab from "@/components/tpo/drive/OffersTab";
import { offerToNextWaitlisted, previewOfferToNext } from "@/api/Services/TpoHubService";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, pathname: "/tpo/drives/1", push: jest.fn(), replace: jest.fn() }) }));
jest.mock("@/api/Services/TpoService", () => ({
  attachOfferLetter: jest.fn(), externalAcceptance: jest.fn(), recordSelection: jest.fn(), reverseAcceptance: jest.fn(),
  setJoiningStatus: jest.fn(), verifyAndReleaseOffer: jest.fn(), withdrawOffer: jest.fn(),
}));
jest.mock("@/api/Services/TpoHubService", () => ({
  commitSelectionsImport: jest.fn(), offerToNextWaitlisted: jest.fn(), previewOfferToNext: jest.fn(), previewSelectionsImport: jest.fn(),
  getSavedViews: jest.fn().mockResolvedValue({ data: { status: "success", data: [] } }), saveView: jest.fn(), deleteView: jest.fn(),
}));

// Renders a large antd table and modal; under a full-suite run on a loaded machine the default 5s waits are too tight.
jest.setTimeout(30000);
configure({ asyncUtilTimeout: 8000 });

const job = { id: 1, companyName: "Acme" };
const declinedOffer = { offerId: 501, learnerId: 1, firstName: "Asha", lastName: "K", rollNumber: "R001", kind: "OFFER", status: "DECLINED", otherHeldOffers: 0 };

const openMenuAndClick = async () => {
  fireEvent.click(await screen.findByText("Actions"));
  fireEvent.click(await screen.findByText("Offer to next waitlisted"));
};

beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => { Modal.destroyAll(); });

test("shows the ranked waitlist with who's next and who's skipped, before offering", async () => {
  previewOfferToNext.mockResolvedValue({ data: { status: "success", data: {
    candidates: [
      { applicationId: 10, name: "Ravi", rank: 1, eligible: false, reason: "Placed elsewhere" },
      { applicationId: 11, name: "Meera", rank: 2, eligible: true, reason: null },
    ],
    nextEligible: { applicationId: 11, name: "Meera", rank: 2 },
  } } });
  render(<OffersTab job={job} offers={[declinedOffer]} applicants={[]} reload={jest.fn()} onOpenStudent={jest.fn()} />);
  await openMenuAndClick();

  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Offer to Meera?")).toBeInTheDocument();
  expect(within(dialog).getByText(/Rank #1 · Ravi/)).toBeInTheDocument();
  expect(within(dialog).getByText(/Skipped: Placed elsewhere/)).toBeInTheDocument();
  expect(within(dialog).getByText(/Rank #2 · Meera/)).toBeInTheDocument();
  expect(within(dialog).getByText("Next eligible")).toBeInTheDocument();
  expect(offerToNextWaitlisted).not.toHaveBeenCalled();
});

test("confirming runs the real action, which the preview already matched", async () => {
  previewOfferToNext.mockResolvedValue({ data: { status: "success", data: {
    candidates: [{ applicationId: 11, name: "Meera", rank: 1, eligible: true, reason: null }],
    nextEligible: { applicationId: 11, name: "Meera", rank: 1 },
  } } });
  offerToNextWaitlisted.mockResolvedValue({ data: { status: "success", data: { offered: true, name: "Meera", offerId: 999, skipped: [] } } });
  render(<OffersTab job={job} offers={[declinedOffer]} applicants={[]} reload={jest.fn()} onOpenStudent={jest.fn()} />);
  await openMenuAndClick();

  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Offer to next waitlisted" }));
  expect(await screen.findByText("Offered to Meera")).toBeInTheDocument();
  expect(offerToNextWaitlisted).toHaveBeenCalledWith(501);
});

test("an empty waitlist disables the confirm action instead of pretending there's someone to offer", async () => {
  previewOfferToNext.mockResolvedValue({ data: { status: "success", data: { candidates: [], nextEligible: {} } } });
  render(<OffersTab job={job} offers={[declinedOffer]} applicants={[]} reload={jest.fn()} onOpenStudent={jest.fn()} />);
  await openMenuAndClick();

  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("The waitlist is empty")).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Offer to next waitlisted" })).toBeDisabled();
});
